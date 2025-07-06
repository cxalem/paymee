#!/usr/bin/env ts-node

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { sendEvm } from "../tasks/sendEvm";

// Simple configuration - you can modify these defaults
const DEFAULT_CONFIG = {
  oappConfig: "./layerzero.config.ts", // Path to your LayerZero config
  minAmount: undefined, // Will use same as amount if not specified
  extraLzReceiveOptions: undefined,
  extraLzComposeOptions: undefined,
  extraNativeDropOptions: undefined,
  composeMsg: undefined,
  oftAddress: undefined, // Will auto-detect from config if not provided
};

async function sendOFT() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log(`
Usage: npx ts-node scripts/sendOFT.ts <srcEid> <dstEid> <amount> <toAddress> [oftAddress]

Examples:
  # Send 100 tokens from Ethereum (30101) to Polygon (30109)
  npx ts-node scripts/sendOFT.ts 30101 30109 100 0x1234567890123456789012345678901234567890

  # Send with specific OFT address
  npx ts-node scripts/sendOFT.ts 30101 30109 100 0x1234567890123456789012345678901234567890 0xOFTAddress

Common Endpoint IDs:
  - Ethereum: 30101
  - Polygon: 30109
  - Arbitrum: 30110
  - Optimism: 30111
  - Base: 30184
  - Sepolia: 40161
  - Mumbai: 40109
    `);
    process.exit(1);
  }

  const [srcEid, dstEid, amount, to, oftAddress] = args;

  const sendArgs = {
    srcEid: parseInt(srcEid),
    dstEid: parseInt(dstEid),
    amount: amount,
    to: to,
    oappConfig: DEFAULT_CONFIG.oappConfig,
    minAmount: DEFAULT_CONFIG.minAmount,
    extraLzReceiveOptions: DEFAULT_CONFIG.extraLzReceiveOptions,
    extraLzComposeOptions: DEFAULT_CONFIG.extraLzComposeOptions,
    extraNativeDropOptions: DEFAULT_CONFIG.extraNativeDropOptions,
    composeMsg: DEFAULT_CONFIG.composeMsg,
    oftAddress: oftAddress || DEFAULT_CONFIG.oftAddress,
  };

  console.log("🚀 Starting OFT transfer...");
  console.log(`📤 From: Chain ${srcEid}`);
  console.log(`📥 To: Chain ${dstEid}`);
  console.log(`💰 Amount: ${amount} tokens`);
  console.log(`👤 Recipient: ${to}`);
  if (oftAddress) {
    console.log(`🏷️ OFT Address: ${oftAddress}`);
  }
  console.log("");

  try {
    // Create a minimal HRE object - this will be enhanced by the sendEvm function
    const hre = require("hardhat") as HardhatRuntimeEnvironment;
    
    const result = await sendEvm(sendArgs, hre);
    
    console.log("✅ Transfer completed successfully!");
    console.log(`📋 Transaction Hash: ${result.txHash}`);
    console.log(`🔍 LayerZero Scan: ${result.scanLink}`);
    console.log("");
    console.log("⏳ Your tokens will arrive on the destination chain shortly.");
    console.log("   You can track the progress using the LayerZero scan link above.");
    
  } catch (error) {
    console.error("❌ Transfer failed:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  sendOFT().catch((error: any) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
}

export { sendOFT }; 