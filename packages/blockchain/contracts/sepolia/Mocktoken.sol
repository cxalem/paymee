// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("MockUSDC", "MUSDC") {
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}