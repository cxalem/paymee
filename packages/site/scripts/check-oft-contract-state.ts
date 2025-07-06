import { publicClients, WETH_ADDRESSES } from "../lib/metamask-utils";
import { ethers } from "ethers";

// Colors for console output
const colors = {
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg: string) =>
    console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg: string) =>
    console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg: string) =>
    console.log(`${colors.bold}${colors.blue}🔍 ${msg}${colors.reset}`),
};

// WETH OFT Adapter addresses
const WETH_OFT_ADDRESSES = {
  sepolia: "0x2F26C64514f40833F5b01e1FeEB2db35167a1028",
  optimismSepolia: "0x1b421839E647953739D30e2EE06eb80b8A141BAB",
} as const;

// OFT ABI for checking contract state
const OFT_ABI = [
  "function owner() external view returns (address)",
  "function paused() external view returns (bool)",
  "function token() external view returns (address)",
  "function endpoint() external view returns (address)",
  "function peers(uint32) external view returns (bytes32)",
  "function isPeer(uint32, bytes32) external view returns (bool)",
  "function delegates(address) external view returns (bool)",
  "function approvalRequired() external view returns (bool)",
] as const;

// Minimal LayerZero endpoint ABI
const ENDPOINT_ABI = [
  "function delegates(address) external view returns (bool)",
  "function isValidReceiveLibrary(address, address) external view returns (bool)",
] as const;

// Check OFT contract state
async function checkOFTContractState(network: "sepolia" | "optimismSepolia") {
  const client = publicClients[network];
  const oftAddress = WETH_OFT_ADDRESSES[network];
  const networkName =
    network === "sepolia" ? "Ethereum Sepolia" : "Optimism Sepolia";

  log.header(`Checking WETH OFT contract on ${networkName}`);
  console.log(`${colors.dim}Contract: ${oftAddress}${colors.reset}`);
  console.log("");

  try {
    // Basic contract checks
    const results = await Promise.allSettled([
      client.readContract({
        address: oftAddress as `0x${string}`,
        abi: OFT_ABI,
        functionName: "owner",
      }),
      client.readContract({
        address: oftAddress as `0x${string}`,
        abi: OFT_ABI,
        functionName: "token",
      }),
      client.readContract({
        address: oftAddress as `0x${string}`,
        abi: OFT_ABI,
        functionName: "endpoint",
      }),
      client.readContract({
        address: oftAddress as `0x${string}`,
        abi: OFT_ABI,
        functionName: "approvalRequired",
      }),
    ]);

    // Process results
    const [ownerResult, tokenResult, endpointResult, approvalResult] = results;

    if (ownerResult.status === "fulfilled") {
      log.info(`👤 Owner: ${ownerResult.value}`);
    } else {
      log.error(`❌ Could not get owner: ${ownerResult.reason}`);
    }

    if (tokenResult.status === "fulfilled") {
      log.info(`🪙 Underlying token: ${tokenResult.value}`);

      // Verify it matches expected WETH address
      const expectedWETH = WETH_ADDRESSES[network];
      if (tokenResult.value.toLowerCase() === expectedWETH.toLowerCase()) {
        log.success("✅ Underlying token matches expected WETH address");
      } else {
        log.error("❌ Underlying token MISMATCH!");
        console.log(`${colors.dim}   Expected: ${expectedWETH}${colors.reset}`);
        console.log(
          `${colors.dim}   Got:      ${tokenResult.value}${colors.reset}`
        );
      }
    } else {
      log.error(`❌ Could not get token: ${tokenResult.reason}`);
    }

    if (endpointResult.status === "fulfilled") {
      log.info(`🌐 LayerZero endpoint: ${endpointResult.value}`);
    } else {
      log.error(`❌ Could not get endpoint: ${endpointResult.reason}`);
    }

    if (approvalResult.status === "fulfilled") {
      log.info(`🔐 Approval required: ${approvalResult.value}`);
    } else {
      log.error(
        `❌ Could not get approval requirement: ${approvalResult.reason}`
      );
    }

    // Check paused state
    try {
      const paused = await client.readContract({
        address: oftAddress as `0x${string}`,
        abi: OFT_ABI,
        functionName: "paused",
      });

      if (paused) {
        log.error(
          "🚫 CONTRACT IS PAUSED! This would cause all transactions to revert."
        );
      } else {
        log.success("✅ Contract is not paused");
      }
    } catch {
      log.info(
        "ℹ️  Contract does not have pause functionality (normal for some OFTs)"
      );
    }

    console.log("");
  } catch (error) {
    log.error(
      `❌ Error checking contract state: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Check peer configuration
async function checkPeerConfiguration() {
  const sourceClient = publicClients.sepolia;
  const destClient = publicClients.optimismSepolia;

  log.header("🔗 Checking LayerZero peer configuration");
  console.log("");

  try {
    // Check if Ethereum Sepolia OFT knows about Optimism Sepolia
    const sepoliaToOptimism = await sourceClient.readContract({
      address: WETH_OFT_ADDRESSES.sepolia as `0x${string}`,
      abi: OFT_ABI,
      functionName: "peers",
      args: [40232], // Optimism Sepolia endpoint ID
    });

    console.log(
      `${colors.dim}Sepolia → Optimism peer: ${sepoliaToOptimism}${colors.reset}`
    );

    // Expected peer should be the Optimism OFT address in bytes32 format
    const expectedPeer = ethers.zeroPadValue(
      WETH_OFT_ADDRESSES.optimismSepolia,
      32
    );

    if (sepoliaToOptimism.toLowerCase() === expectedPeer.toLowerCase()) {
      log.success("✅ Sepolia → Optimism peer configured correctly");
    } else {
      log.error("❌ Sepolia → Optimism peer MISCONFIGURED!");
      console.log(`${colors.dim}   Expected: ${expectedPeer}${colors.reset}`);
      console.log(
        `${colors.dim}   Got:      ${sepoliaToOptimism}${colors.reset}`
      );
    }

    // Check reverse direction
    const optimismToSepolia = await destClient.readContract({
      address: WETH_OFT_ADDRESSES.optimismSepolia as `0x${string}`,
      abi: OFT_ABI,
      functionName: "peers",
      args: [40161], // Ethereum Sepolia endpoint ID
    });

    console.log(
      `${colors.dim}Optimism → Sepolia peer: ${optimismToSepolia}${colors.reset}`
    );

    const expectedReversePeer = ethers.zeroPadValue(
      WETH_OFT_ADDRESSES.sepolia,
      32
    );

    if (optimismToSepolia.toLowerCase() === expectedReversePeer.toLowerCase()) {
      log.success("✅ Optimism → Sepolia peer configured correctly");
    } else {
      log.error("❌ Optimism → Sepolia peer MISCONFIGURED!");
      console.log(
        `${colors.dim}   Expected: ${expectedReversePeer}${colors.reset}`
      );
      console.log(
        `${colors.dim}   Got:      ${optimismToSepolia}${colors.reset}`
      );
    }
  } catch (error) {
    log.error(
      `❌ Error checking peer configuration: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  console.log("");
}

// Main function
async function main() {
  console.log(
    `${colors.bold}🕵️ WETH OFT Contract State Checker${colors.reset}`
  );
  console.log(
    `${colors.dim}Diagnosing LayerZero execution reverts...${colors.reset}`
  );
  console.log("");

  // Check both contracts
  await checkOFTContractState("sepolia");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  await checkOFTContractState("optimismSepolia");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  // Check peer configuration
  await checkPeerConfiguration();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  log.info('💡 Common causes of "simulation reverted":');
  console.log(`${colors.dim}   1. Contract paused state${colors.reset}`);
  console.log(`${colors.dim}   2. Misconfigured peer addresses${colors.reset}`);
  console.log(
    `${colors.dim}   3. Invalid underlying token address${colors.reset}`
  );
  console.log(
    `${colors.dim}   4. LayerZero endpoint configuration issues${colors.reset}`
  );
  console.log(
    `${colors.dim}   5. Insufficient gas (but you increased this already)${colors.reset}`
  );
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
}

export { checkOFTContractState };
