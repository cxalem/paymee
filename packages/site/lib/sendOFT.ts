import { ethers } from "ethers";
import { parseUnits } from "ethers";
import { Options, addressToBytes32 } from "@layerzerolabs/lz-v2-utilities";

// Types for the function parameters
export interface SendOFTParams {
  srcEid: number;
  dstEid: number;
  amount: string;
  to: string;
  oftAddress: string;
  minAmount?: string;
  provider?: ethers.BrowserProvider; // MetaMask or other wallet provider
  signer?: ethers.Signer;
}

export interface SendOFTResult {
  txHash: string;
  scanLink: string;
}

// OFT ABI - minimal interface for what we need
const OFT_ABI = [
  "function token() external view returns (address)",
  "function decimals() external view returns (uint8)",
  "function quoteSend((uint32,bytes32,uint256,uint256,bytes,bytes,bytes), bool) external view returns ((uint256,uint256))",
  "function send((uint32,bytes32,uint256,uint256,bytes,bytes,bytes), (uint256,uint256), address) external payable returns ((bytes32,uint64,uint256))",
  "function approvalRequired() external view returns (bool)",
];

const ERC20_ABI = [
  "function decimals() external view returns (uint8)",
  "function allowance(address,address) external view returns (uint256)",
  "function approve(address,uint256) external returns (bool)",
];

/**
 * Send OFT tokens cross-chain from React/Browser environment
 */
export async function sendOFT(params: SendOFTParams): Promise<SendOFTResult> {
  const {
    srcEid,
    dstEid,
    amount,
    to,
    oftAddress,
    minAmount,
    provider,
    signer,
  } = params;

  // Get provider and signer
  let ethProvider: ethers.BrowserProvider;
  let ethSigner: ethers.Signer;

  if (provider && signer) {
    ethProvider = provider;
    ethSigner = signer;
  } else if (typeof window !== "undefined" && window.ethereum) {
    // Use MetaMask or other injected wallet
    ethProvider = new ethers.BrowserProvider(window.ethereum);
    ethSigner = await ethProvider.getSigner();
  } else {
    throw new Error("No wallet provider found. Please connect your wallet.");
  }

  console.log("🚀 Starting OFT transfer...");
  console.log(`📤 From: Chain ${srcEid}`);
  console.log(`📥 To: Chain ${dstEid}`);
  console.log(`💰 Amount: ${amount} tokens`);
  console.log(`👤 Recipient: ${to}`);
  console.log(`🏷️ OFT Address: ${oftAddress}`);

  // Create OFT contract instance
  const oft = new ethers.Contract(oftAddress, OFT_ABI, ethSigner);

  // Get underlying token info
  let decimals: number;
  let underlying: string;

  try {
    // Try to get underlying token (for OFT Adapters)
    underlying = await oft.token();
    const erc20 = new ethers.Contract(underlying, ERC20_ABI, ethSigner);
    decimals = await erc20.decimals();
  } catch {
    // If token() fails, it's probably a regular OFT
    decimals = await oft.decimals();
    underlying = oftAddress;
  }

  // Convert amount to proper units
  const amountUnits = parseUnits(amount, decimals);
  const minAmountUnits = minAmount
    ? parseUnits(minAmount, decimals)
    : amountUnits;

  // Handle approval if needed (for OFT Adapters)
  if (underlying !== oftAddress) {
    try {
      const approvalRequired = await oft.approvalRequired();
      if (approvalRequired) {
        console.log("🔐 Checking token approval...");

        const erc20 = new ethers.Contract(underlying, ERC20_ABI, ethSigner);
        const signerAddress = await ethSigner.getAddress();
        const currentAllowance = await erc20.allowance(
          signerAddress,
          oftAddress
        );

        if (currentAllowance < amountUnits) {
          console.log("📝 Approving tokens...");
          const approveTx = await erc20.approve(oftAddress, amountUnits);
          await approveTx.wait();
          console.log("✅ Approval confirmed");
        }
      }
    } catch {
      console.log("ℹ️ No approval required (regular OFT)");
    }
  }

  // Convert destination address to bytes32
  const toBytes = addressToBytes32(to);

  // Build basic options (you can extend this for more complex scenarios)
  const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0);
  const extraOptions = options.toHex();

  // Prepare send parameters
  const sendParam = {
    dstEid,
    to: toBytes,
    amountLD: amountUnits.toString(),
    minAmountLD: minAmountUnits.toString(),
    extraOptions: extraOptions,
    composeMsg: "0x",
    oftCmd: "0x",
  };

  // Quote the transaction
  console.log("💰 Calculating fees...");
  const msgFee = await oft.quoteSend(sendParam, false);

  console.log(`⛽ Estimated fee: ${ethers.formatEther(msgFee.nativeFee)} ETH`);

  // Send the transaction
  console.log("📤 Sending transaction...");
  const signerAddress = await ethSigner.getAddress();
  const tx = await oft.send(sendParam, msgFee, signerAddress, {
    value: msgFee.nativeFee,
  });

  console.log(`📋 Transaction sent: ${tx.hash}`);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await tx.wait();
  const txHash = receipt?.hash || tx.hash;

  // Generate scan link (simplified - you might want to make this more sophisticated)
  const scanLink = `https://layerzeroscan.com/tx/${txHash}`;

  console.log("✅ Transfer completed successfully!");
  console.log(`📋 Transaction Hash: ${txHash}`);
  console.log(`🔍 LayerZero Scan: ${scanLink}`);

  return { txHash, scanLink };
}

// Helper function to get common endpoint IDs
export const ENDPOINT_IDS = {
  ETHEREUM: 30101,
  POLYGON: 30109,
  ARBITRUM: 30110,
  OPTIMISM: 30111,
  BASE: 30184,
  SEPOLIA: 40161,
  MUMBAI: 40109,
} as const;

// Helper function to get network name from endpoint ID
export function getNetworkName(eid: number): string {
  const networks: Record<number, string> = {
    30101: "Ethereum",
    30109: "Polygon",
    30110: "Arbitrum",
    30111: "Optimism",
    30184: "Base",
    40161: "Sepolia",
    40109: "Mumbai",
  };
  return networks[eid] || `Chain ${eid}`;
}
