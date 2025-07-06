const { ethers } = require("hardhat");

async function main() {
  // Contract addresses
  const WETH_OFT_ADDRESSES = {
    40161: "0x2F26C64514f40833F5b01e1FeEB2db35167a1028", // Ethereum Sepolia
    11155420: "0x1b421839E647953739D30e2EE06eb80b8A141BAB", // Optimism Sepolia
  };

  // Get current network
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  
  let currentEid, peerEid, contractAddress;
  
  if (chainId === 11155111) { // Ethereum Sepolia
    currentEid = 40161;
    peerEid = 11155420;
    contractAddress = WETH_OFT_ADDRESSES[40161];
    console.log("🔍 Checking Ethereum Sepolia WETH OFT Adapter...");
  } else if (chainId === 11155420) { // Optimism Sepolia
    currentEid = 11155420;
    peerEid = 40161;
    contractAddress = WETH_OFT_ADDRESSES[11155420];
    console.log("🔍 Checking Optimism Sepolia WETH OFT Adapter...");
  } else {
    console.error(`❌ Unsupported network: ${chainId}`);
    return;
  }

  console.log(`📍 Contract address: ${contractAddress}`);

  const contract = await ethers.getContractAt(
    "WETHOFTAdapter",
    contractAddress
  );

  try {
    // Check if peer is set
    const peer = await contract.peers(peerEid);
    console.log(`📍 Peer for EID ${peerEid}: ${peer}`);
    
    if (peer === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.log(`❌ No peer set for EID ${peerEid}`);
    } else {
      console.log(`✅ Peer is set for EID ${peerEid}`);
    }
  } catch (error) {
    console.error("❌ Error checking peer:", error.message);
  }

  // Check owner
  try {
    const owner = await contract.owner();
    console.log(`👤 Contract owner: ${owner}`);
  } catch (error) {
    console.error("❌ Error checking owner:", error.message);
  }

  // Check WETH address
  try {
    const wethAddress = await contract.getWETH();
    console.log(`🪙 WETH address: ${wethAddress}`);
  } catch (error) {
    console.error("❌ Error checking WETH address:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 