// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OApp, MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { MessagingReceipt } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymeeRouter is OApp, ReentrancyGuard {
    struct PaymentLink {
        address freelancer;
        uint256 amount;
        address token;
        uint32 destinationEid;
        bool isActive;
        uint256 createdAt;
        string metadata; // Hypergraph CID
    }

    struct CrossChainPayment {
        bytes32 linkId;
        address payer;
        uint256 amount;
        address token;
        bytes32 freelancerSolanaAddress;
    }

    mapping(bytes32 => PaymentLink) public paymentLinks;
    mapping(bytes32 => bool) public processedPayments;
    
    event PaymentLinkCreated(bytes32 indexed linkId, address indexed freelancer, uint256 amount, address token, uint32 destinationEid, string metadata);
    event CrossChainPaymentInitiated(bytes32 indexed linkId, address indexed payer, uint256 amount);
    event PaymentCompleted(bytes32 indexed linkId);

    constructor(
        address _endpoint,
        address _owner
    ) OApp(_endpoint, _owner) Ownable(_owner) {}

    function createPaymentLink(
        uint256 _amount,
        address _token,
        uint32 _destinationEid,
        string calldata _metadata
    ) external returns (bytes32) {
        bytes32 linkId = keccak256(abi.encodePacked(
            msg.sender,
            _amount,
            _token,
            block.timestamp,
            block.number
        ));

        
        paymentLinks[linkId] = PaymentLink({
            freelancer: msg.sender,
            amount: _amount,
            token: _token,
            destinationEid: _destinationEid,
            isActive: true,
            createdAt: block.timestamp,
            metadata: _metadata
        });

        emit PaymentLinkCreated(linkId, msg.sender, _amount, _token, _destinationEid, _metadata);
        return linkId;
    }

    function quote(
        bytes32 _linkId,
        bytes calldata _options
    ) public view returns (MessagingFee memory fee) {
        PaymentLink storage link = paymentLinks[_linkId];
        require(link.isActive, "Invalid link");
        
        // Create dummy message for fee estimation
        CrossChainPayment memory payment = CrossChainPayment({
            linkId: _linkId,
            payer: address(0),
            amount: link.amount,
            token: link.token,
            freelancerSolanaAddress: bytes32(0)
        });

        bytes memory message = abi.encode(payment);
        return _quote(link.destinationEid, message, _options, false);
    }

    function processPayment(
        bytes32 _linkId,
        bytes32 _freelancerSolanaAddress,
        bytes calldata _options
    ) external payable nonReentrant {
        PaymentLink storage link = paymentLinks[_linkId];
        require(link.isActive, "Invalid or inactive link");
        require(!processedPayments[_linkId], "Already processed");

        // Transfer tokens to this contract
        IERC20(link.token).transferFrom(msg.sender, address(this), link.amount);
        
        // Mark as processed
        processedPayments[_linkId] = true;

        // Prepare cross-chain message
        CrossChainPayment memory payment = CrossChainPayment({
            linkId: _linkId,
            payer: msg.sender,
            amount: link.amount,
            token: link.token,
            freelancerSolanaAddress: _freelancerSolanaAddress
        });

        bytes memory message = abi.encode(payment);

        // Send via LayerZero
        _lzSend(
            link.destinationEid,
            message,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        emit CrossChainPaymentInitiated(_linkId, msg.sender, link.amount);
    }

    function _lzReceive(
        Origin calldata /*_origin*/,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        // Decode acknowledgment from Solana
        bytes32 linkId = abi.decode(_message, (bytes32));
        emit PaymentCompleted(linkId);
    }
}