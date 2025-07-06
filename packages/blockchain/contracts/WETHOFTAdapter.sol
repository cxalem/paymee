// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {OFTAdapter} from "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SendParam, MessagingFee} from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";
import {Origin} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

/**
 * @title WETHOFTAdapter
 * @dev An OFT Adapter that wraps ETH into WETH for cross-chain transfers
 */
contract WETHOFTAdapter is OFTAdapter {
    IWETH public immutable weth;
    
    event ETHWrapped(address indexed user, uint256 amount);
    event ETHUnwrapped(address indexed user, uint256 amount);
    
    constructor(
        address _weth,
        address _lzEndpoint,
        address _delegate
    ) OFTAdapter(_weth, _lzEndpoint, _delegate) Ownable(_delegate) {
        weth = IWETH(_weth);
    }
    
    /**
     * @dev Receive ETH and wrap it to WETH
     */
    receive() external payable {
        _wrapETH(msg.value);
    }
    
    /**
     * @dev Wrap ETH to WETH
     */
    function wrapETH() external payable {
        require(msg.value > 0, "Must send ETH");
        _wrapETH(msg.value);
    }
    
    /**
     * @dev Unwrap WETH to ETH
     */
    function unwrapETH(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(weth.balanceOf(msg.sender) >= amount, "Insufficient WETH balance");
        
        // Transfer WETH from user to this contract
        weth.transferFrom(msg.sender, address(this), amount);
        
        // Unwrap WETH to ETH
        weth.withdraw(amount);
        
        // Send ETH to user
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit ETHUnwrapped(msg.sender, amount);
    }
    
    /**
     * @dev Get the WETH token address
     */
    function getWETH() external view returns (address) {
        return address(weth);
    }
    
    /**
     * @dev Internal function to wrap ETH to WETH
     */
    function _wrapETH(uint256 amount) internal {
        weth.deposit{value: amount}();
        emit ETHWrapped(msg.sender, amount);
    }
    
    /**
     * @dev Override to handle automatic unwrapping on receive
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        // Call parent implementation
        super._lzReceive(_origin, _guid, _message, _executor, _extraData);
        
        // Note: Automatic unwrapping would happen in a compose call
        // For simplicity, users will need to manually unwrap WETH to ETH
    }
    
    /**
     * @dev Emergency function to recover stuck ETH
     */
    function rescueETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to rescue");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "ETH rescue failed");
    }
    
    /**
     * @dev Emergency function to recover stuck tokens
     */
    function rescueToken(address token, uint256 amount) external onlyOwner {
        require(token != address(weth), "Cannot rescue WETH");
        IERC20(token).transfer(owner(), amount);
    }
} 