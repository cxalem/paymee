"use server";

import { ethers } from "ethers";

// LayerZero imports
import { Options, addressToBytes32 } from "@layerzerolabs/lz-v2-utilities";

// ABI imports
import IOFT_ABI from "../../lib/abis/IOFT.json";
import ERC20_ABI from "../../lib/abis/ERC20.json";

export interface SendOFTParams {
  srcEid: number;
  dstEid: number;
  amount: string;
  to: string;
  oftAddress?: string;
  minAmount?: string;
  extraLzReceiveOptions?: string[];
  extraLzComposeOptions?: string[];
  extraNativeDropOptions?: string[];
  composeMsg?: string;
}

export interface SendOFTResult {
  success: boolean;
  txHash?: string;
  scanLink?: string;
  error?: string;
}

// Network configurations
const NETWORK_CONFIG = {
  40161: {
    name: "ethereum-sepolia",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    chainId: 11155111,
    isTestnet: true,
  },
  11155420: {
    name: "optimism-sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    chainId: 11155420,
    isTestnet: true,
  },
} as const;

// Deployed contract addresses
const CONTRACT_ADDRESSES = {
  40161: "0x7a411471724e12Bd057652B1FF7c52c068e1C9b7", // Sepolia
  11155420: "0xaDd23f5D0Ec63245D3b33051dbFCE0CF81F49076", // Optimism Sepolia
} as const;



// Utility functions
function getLayerZeroScanLink(txHash: string, isTestnet = false): string {
  const baseUrl = isTestnet
    ? "https://testnet.layerzeroscan.com"
    : "https://layerzeroscan.com";
  return `${baseUrl}/tx/${txHash}`;
}

function getBlockExplorerLink(srcEid: number, txHash: string): string {
  const network = NETWORK_CONFIG[srcEid as keyof typeof NETWORK_CONFIG];
  if (!network) return "";

  const explorerUrls = {
    40161: "https://sepolia.etherscan.io",
    11155420: "https://sepolia-optimism.etherscan.io",
  };

  const explorerUrl = explorerUrls[srcEid as keyof typeof explorerUrls];
  return explorerUrl ? `${explorerUrl}/tx/${txHash}` : "";
}

function formatBigIntForDisplay(n: bigint): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "_");
}

export async function sendOFTServerAction(
  params: SendOFTParams
): Promise<SendOFTResult> {
  try {
    const {
      srcEid,
      dstEid,
      amount,
      to,
      oftAddress,
      minAmount,
      extraLzReceiveOptions,
      extraLzComposeOptions,
      extraNativeDropOptions,
      composeMsg,
    } = params;

    // Validate required fields
    if (!srcEid || !dstEid || !amount || !to) {
      return {
        success: false,
        error: "Missing required fields: srcEid, dstEid, amount, to",
      };
    }

    // Validate network support
    const srcNetwork = NETWORK_CONFIG[srcEid as keyof typeof NETWORK_CONFIG];
    if (!srcNetwork) {
      return {
        success: false,
        error: `Unsupported source network: ${srcEid}`,
      };
    }

    console.log("🚀 Starting server-side OFT transfer...");
    console.log(`📤 From: Chain ${srcEid} (${srcNetwork.name})`);
    console.log(`📥 To: Chain ${dstEid}`);
    console.log(`💰 Amount: ${amount} tokens`);
    console.log(`👤 Recipient: ${to}`);

    const privateKey =
      "24f8e64c71b7432a20818e75dfbbc840d56181da20cb36b86aa8f03d360fc234";
    if (!privateKey) {
      return {
        success: false,
        error: "PRIVATE_KEY environment variable not set",
      };
    }

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(srcNetwork.rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log(`🔑 Using wallet: ${signer.address}`);

    // Get OFT contract address
    const wrapperAddress =
      oftAddress ||
      CONTRACT_ADDRESSES[srcEid as keyof typeof CONTRACT_ADDRESSES];
    if (!wrapperAddress) {
      return {
        success: false,
        error: `No OFT contract address found for chain ${srcEid}`,
      };
    }

    console.log(`📋 OFT Contract: ${wrapperAddress}`);

    // Connect to OFT contract
    const oft = new ethers.Contract(wrapperAddress, IOFT_ABI, signer);

    // Get underlying token address
    let underlying: string;
    try {
      underlying = await oft.token();
      console.log(`🪙 Underlying token: ${underlying}`);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get underlying token: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Connect to ERC20 token
    const erc20 = new ethers.Contract(underlying, ERC20_ABI, signer);

    // Get token decimals
    let decimals: number;
    try {
      decimals = await erc20.decimals();
      console.log(`📊 Token decimals: ${decimals}`);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get token decimals: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Parse amount
    let amountUnits: bigint;
    try {
      amountUnits = ethers.parseUnits(amount, decimals);
      console.log(`💱 Amount in units: ${amountUnits.toString()}`);
    } catch (error) {
      return {
        success: false,
        error: `Invalid amount format: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Check if approval is required (for OFT Adapters)
    try {
      const approvalRequired = await oft.approvalRequired();
      if (approvalRequired) {
        console.log("🔒 OFT Adapter detected - checking ERC20 allowance...");

        // Check current allowance
        const currentAllowance = await erc20.allowance(
          signer.address,
          wrapperAddress
        );
        console.log(
          `📊 Current allowance: ${formatBigIntForDisplay(currentAllowance)}`
        );
        console.log(
          `📊 Required amount: ${formatBigIntForDisplay(amountUnits)}`
        );

        if (currentAllowance < amountUnits) {
          console.log("❌ Insufficient allowance - approving ERC20 tokens...");
          const approveTx = await erc20.approve(wrapperAddress, amountUnits);
          console.log(`⏳ Approval transaction hash: ${approveTx.hash}`);
          await approveTx.wait();
          console.log("✅ ERC20 approval confirmed");
        } else {
          console.log("✅ Sufficient allowance already exists");
        }
      }
    } catch {
      // If approvalRequired() doesn't exist, assume it's a regular OFT
      console.log("ℹ️ No approval required (regular OFT detected)");
    }

    // Convert recipient address to bytes32
    const toBytes = addressToBytes32(to);

    // Build options dynamically
    let options = Options.newOptions();
    
    // Add default lzReceive option if no custom options provided
    if (!extraLzReceiveOptions || extraLzReceiveOptions.length === 0) {
      options = options.addExecutorLzReceiveOption(500000, 0); // 500k gas (increased from 200k), 0 value
      console.log("⚙️ Added default lzReceive option: 500000 gas, 0 value");
    }

    // Add lzReceive options
    if (extraLzReceiveOptions && extraLzReceiveOptions.length > 0) {
      if (extraLzReceiveOptions.length % 2 !== 0) {
        return {
          success: false,
          error: `Invalid lzReceive options: received ${extraLzReceiveOptions.length} values, but expected pairs of gas,value`,
        };
      }

      for (let i = 0; i < extraLzReceiveOptions.length; i += 2) {
        const gas = Number(extraLzReceiveOptions[i]);
        const value = Number(extraLzReceiveOptions[i + 1]) || 0;
        options = options.addExecutorLzReceiveOption(gas, value);
        console.log(`⚙️ Added lzReceive option: ${gas} gas, ${value} value`);
      }
    }

    // Add lzCompose options
    if (extraLzComposeOptions && extraLzComposeOptions.length > 0) {
      if (extraLzComposeOptions.length % 3 !== 0) {
        return {
          success: false,
          error: `Invalid lzCompose options: received ${extraLzComposeOptions.length} values, but expected triplets of index,gas,value`,
        };
      }

      for (let i = 0; i < extraLzComposeOptions.length; i += 3) {
        const index = Number(extraLzComposeOptions[i]);
        const gas = Number(extraLzComposeOptions[i + 1]);
        const value = Number(extraLzComposeOptions[i + 2]) || 0;
        options = options.addExecutorComposeOption(index, gas, value);
        console.log(
          `⚙️ Added lzCompose option: index ${index}, ${gas} gas, ${value} value`
        );
      }
    }

    // Add native drop options
    if (extraNativeDropOptions && extraNativeDropOptions.length > 0) {
      if (extraNativeDropOptions.length % 2 !== 0) {
        return {
          success: false,
          error: `Invalid native drop options: received ${extraNativeDropOptions.length} values, but expected pairs of amount,recipient`,
        };
      }

      for (let i = 0; i < extraNativeDropOptions.length; i += 2) {
        const amountStr = extraNativeDropOptions[i];
        const recipient = extraNativeDropOptions[i + 1];

        if (!amountStr || !recipient) {
          return {
            success: false,
            error: `Invalid native drop option: Both amount and recipient must be provided`,
          };
        }

        try {
          options = options.addExecutorNativeDropOption(
            amountStr.trim(),
            recipient.trim()
          );
          console.log(
            `⚙️ Added native drop option: ${amountStr.trim()} wei to ${recipient.trim()}`
          );
        } catch (error) {
          return {
            success: false,
            error: `Failed to add native drop option: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      }
    }

    const extraOptions = options.toHex();

    // Build send parameters
    const sendParam = {
      dstEid,
      to: toBytes,
      amountLD: amountUnits.toString(),
      minAmountLD: minAmount
        ? ethers.parseUnits(minAmount, decimals).toString()
        : amountUnits.toString(),
      extraOptions: extraOptions,
      composeMsg: composeMsg ? composeMsg.toString() : "0x",
      oftCmd: "0x",
    };

    console.log("💰 Quoting the native gas cost for the send transaction...");

    // Quote the messaging fee
    let msgFee: { nativeFee: bigint; lzTokenFee: bigint };
    try {
      msgFee = await oft.quoteSend(sendParam, false);
      console.log(`⛽ Native fee: ${ethers.formatEther(msgFee.nativeFee)} ETH`);
      console.log(`🪙 LZ token fee: ${msgFee.lzTokenFee.toString()}`);
    } catch (error) {
      return {
        success: false,
        error: `Failed to quote gas cost: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    console.log("📤 Sending the transaction...");

    // Send the transaction
    let tx: ethers.ContractTransactionResponse;
    try {
      tx = await oft.send(sendParam, msgFee, signer.address, {
        value: msgFee.nativeFee,
      });
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
    } catch (error) {
      return {
        success: false,
        error: `Failed to send transaction: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    const txHash = receipt?.hash || tx.hash;

    console.log("✅ Transaction confirmed!");
    console.log(`📋 Transaction Hash: ${txHash}`);

    // Generate scan links
    const scanLink = getLayerZeroScanLink(txHash, srcNetwork.isTestnet);
    const explorerLink = getBlockExplorerLink(srcEid, txHash);

    console.log(`🔍 LayerZero Scan: ${scanLink}`);
    if (explorerLink) {
      console.log(`🔍 Block Explorer: ${explorerLink}`);
    }

    return {
      success: true,
      txHash,
      scanLink,
    };
  } catch (error) {
    console.error("❌ Transfer failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
