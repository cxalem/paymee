"use server";

import { ethers } from "ethers";
import { Options } from "@layerzerolabs/lz-v2-utilities";

// ABI imports
import WETH_ABI from "../../lib/abis/WETH.json";
import WETH_OFT_ABI from "../../lib/abis/WETHOFTAdapter.json";

// Contract addresses for WETH OFT Adapters
const WETH_OFT_ADDRESSES = {
  40161: "0x2F26C64514f40833F5b01e1FeEB2db35167a1028", // Ethereum Sepolia
  40232: "0x1b421839E647953739D30e2EE06eb80b8A141BAB", // Optimism Sepolia
};

// WETH contract addresses
const WETH_ADDRESSES = {
  40161: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Ethereum Sepolia
  40232: "0x4200000000000000000000000000000000000006", // Optimism Sepolia
};

// RPC URLs
const RPC_URLS = {
  40161: "https://ethereum-sepolia-rpc.publicnode.com",
  40232: "https://sepolia.optimism.io",
};

// Network names for logging
const NETWORK_NAMES = {
  40161: "Ethereum Sepolia",
  40232: "Optimism Sepolia",
};



export interface SendETHParams {
  srcEid: number;
  dstEid: number;
  amount: string; // in ETH
  to: string; // recipient address
}

export interface SendETHResult {
  success: boolean;
  txHash?: string;
  scanUrl?: string;
  error?: string;
}

export async function sendETHServerAction(
  params: SendETHParams
): Promise<SendETHResult> {
  try {
    const { srcEid, dstEid, amount, to } = params;

    // Validate parameters
    if (!srcEid || !dstEid || !amount || !to) {
      return { success: false, error: "Missing required parameters" };
    }

    if (!WETH_OFT_ADDRESSES[srcEid as keyof typeof WETH_OFT_ADDRESSES]) {
      return { success: false, error: `Unsupported source chain: ${srcEid}` };
    }

    if (!WETH_OFT_ADDRESSES[dstEid as keyof typeof WETH_OFT_ADDRESSES]) {
      return {
        success: false,
        error: `Unsupported destination chain: ${dstEid}`,
      };
    }

    if (!ethers.isAddress(to)) {
      return { success: false, error: "Invalid recipient address" };
    }

    // Get private key from environment
    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY!;
    if (!privateKey) {
      return { success: false, error: "Private key not configured" };
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(
      RPC_URLS[srcEid as keyof typeof RPC_URLS]
    );

    console.log( "******** HERE *********", srcEid, dstEid);

    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(
      `🌉 Bridging ${amount} ETH from ${NETWORK_NAMES[srcEid as keyof typeof NETWORK_NAMES]} to ${NETWORK_NAMES[dstEid as keyof typeof NETWORK_NAMES]}`
    );
    console.log(`📍 From: ${wallet.address}`);
    console.log(`📍 To: ${to}`);

    // Get contract addresses
    const wethOftAddress =
      WETH_OFT_ADDRESSES[srcEid as keyof typeof WETH_OFT_ADDRESSES];
    const wethAddress = WETH_ADDRESSES[srcEid as keyof typeof WETH_ADDRESSES];

    // Create contract instances
    const wethOftContract = new ethers.Contract(
      wethOftAddress,
      WETH_OFT_ABI,
      wallet
    );
    const wethContract = new ethers.Contract(wethAddress, WETH_ABI, wallet);

    // Convert amount to wei
    const amountWei = ethers.parseEther(amount);

    // Convert recipient address to bytes32
    const recipientBytes32 = ethers.zeroPadValue(to, 32);

    // Prepare send parameters with increased execution options for destination chain
    const options = Options.newOptions().addExecutorLzReceiveOption(500000, 0); // 500k gas (increased from 200k), 0 value
    const sendParam = {
      dstEid,
      to: recipientBytes32,
      amountLD: amountWei,
      minAmountLD: amountWei,
      extraOptions: options.toHex(),
      composeMsg: "0x",
      oftCmd: "0x",
    };

    // Get quote for the transaction
    console.log("💰 Getting quote for cross-chain transfer...");
    let quote;
    try {
      quote = await wethOftContract.quoteSend(sendParam, false);
    } catch (quoteError: unknown) {
      // Handle known LayerZero error 0x6c1ccdb5
      if (quoteError && typeof quoteError === 'object' && 'data' in quoteError && quoteError.data === "0x6c1ccdb5") {
        return {
          success: false,
          error: "LayerZero error 0x6c1ccdb5",
        };
      }
      // Handle other quote errors
      const errorMessage = quoteError instanceof Error ? quoteError.message : "Unknown error";
      return {
        success: false,
        error: `Failed to get quote: ${errorMessage}`,
      };
    }

    const nativeFee = quote.nativeFee;

    console.log(`💸 LayerZero fee: ${ethers.formatEther(nativeFee)} ETH`);
    console.log(
      `💰 Total cost: ${ethers.formatEther(amountWei + nativeFee)} ETH`
    );

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    const totalRequired = amountWei + nativeFee;

    if (balance < totalRequired) {
      return {
        success: false,
        error: `Insufficient balance. Required: ${ethers.formatEther(totalRequired)} ETH, Available: ${ethers.formatEther(balance)} ETH`,
      };
    }

    // Check current WETH balance
    console.log("🔍 Checking current WETH balance...");
    const wethBalance = await wethContract.balanceOf(wallet.address);
    console.log(
      `💰 Current WETH balance: ${ethers.formatEther(wethBalance)} WETH`
    );

    if (wethBalance < amountWei) {
      return {
        success: false,
        error: `Insufficient WETH balance. Required: ${ethers.formatEther(amountWei)} WETH, Available: ${ethers.formatEther(wethBalance)} WETH. Please wrap ETH first.`,
      };
    }

    // Check and approve WETH for OFT Adapter
    console.log("🔍 Checking WETH allowance...");
    const allowance = await wethContract.allowance(
      wallet.address,
      wethOftAddress
    );

    if (allowance < amountWei) {
      console.log("📝 Approving WETH for OFT Adapter...");
      const approveTx = await wethContract.approve(
        wethOftAddress,
        ethers.MaxUint256
      );
      console.log(`⏳ Approve tx hash: ${approveTx.hash}`);
      await approveTx.wait();
      console.log("✅ WETH approved");
    } else {
      console.log("✅ WETH already approved");
    }

    // Send WETH cross-chain
    console.log("🚀 Step 3: Sending WETH cross-chain...");
    const fee = { nativeFee, lzTokenFee: BigInt(0) };

    const sendTx = await wethOftContract.send(
      sendParam,
      fee,
      wallet.address, // refundTo
      { value: nativeFee }
    );

    console.log(`✅ Transaction sent: ${sendTx.hash}`);

    // Generate scan URL
    const scanUrl =
      srcEid === 40161
        ? `https://sepolia.etherscan.io/tx/${sendTx.hash}`
        : `https://sepolia-optimism.etherscan.io/tx/${sendTx.hash}`;

    return {
      success: true,
      txHash: sendTx.hash,
      scanUrl,
    };
  } catch (error) {
    console.error("❌ ETH bridge error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
