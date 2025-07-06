const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing WETH OFT Adapter contract...");

  const WETH_OFT_ADDRESS = "0x2F26C64514f40833F5b01e1FeEB2db35167a1028"; // Ethereum Sepolia WETH OFT
  const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Ethereum Sepolia WETH

  // Basic contract interface to test what works
  const BASIC_ABI = [
    "function token() external view returns (address)",
    "function owner() external view returns (address)",
    "function getWETH() external view returns (address)",
  ];

  // OFT Adapter ABI
  const OFT_ADAPTER_ABI = [
    "function token() external view returns (address)",
    "function quoteSend((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) sendParam, bool payInLzToken) external view returns ((uint256 nativeFee, uint256 lzTokenFee) msgFee)",
    "function send((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) sendParam, (uint256 nativeFee, uint256 lzTokenFee) fee, address refundTo) external payable",
  ];

  const [signer] = await ethers.getSigners();
  console.log(`👤 Testing with wallet: ${signer.address}`);

  try {
    // Test basic contract functions
    console.log("\n🔍 Testing basic contract functions...");
    const basicContract = await ethers.getContractAt(BASIC_ABI, WETH_OFT_ADDRESS);
    
    const tokenAddress = await basicContract.token();
    console.log(`📋 Underlying token: ${tokenAddress}`);
    
    const owner = await basicContract.owner();
    console.log(`👑 Contract owner: ${owner}`);

    // Check if it matches WETH address
    if (tokenAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
      console.log("✅ Underlying token is correctly set to WETH");
    } else {
      console.log(`❌ Underlying token mismatch. Expected: ${WETH_ADDRESS}, Got: ${tokenAddress}`);
    }

    // Test custom function
    try {
      const wethFromContract = await basicContract.getWETH();
      console.log(`🪙 WETH from getWETH(): ${wethFromContract}`);
    } catch (error) {
      console.log(`❌ getWETH() failed: ${error.message}`);
    }

  } catch (error) {
    console.log(`❌ Basic contract test failed: ${error.message}`);
  }

  // Test OFT functionality
  try {
    console.log("\n🔍 Testing OFT functionality...");
    const oftContract = await ethers.getContractAt(OFT_ADAPTER_ABI, WETH_OFT_ADDRESS);
    
    // Test quote function with minimal parameters
    const sendParam = {
      dstEid: 11155420, // Optimism Sepolia
      to: ethers.utils.hexZeroPad(signer.address, 32),
      amountLD: ethers.utils.parseEther("0.01"),
      minAmountLD: ethers.utils.parseEther("0.01"),
      extraOptions: "0x00030100110100000000000000000000000000030d40",
      composeMsg: "0x",
      oftCmd: "0x",
    };

    const quote = await oftContract.quoteSend(sendParam, false);
    console.log(`💰 Quote fee: ${ethers.utils.formatEther(quote.nativeFee)} ETH`);
    console.log("✅ Quote function works");

  } catch (error) {
    console.log(`❌ OFT functionality test failed: ${error.message}`);
  }

  // Test WETH contract directly
  try {
    console.log("\n🔍 Testing WETH contract directly...");
    const wethAbi = ["function balanceOf(address) external view returns (uint256)"];
    const wethContract = await ethers.getContractAt(wethAbi, WETH_ADDRESS);
    
    const wethBalance = await wethContract.balanceOf(signer.address);
    console.log(`🪙 WETH balance: ${ethers.utils.formatEther(wethBalance)} WETH`);
    console.log("✅ WETH contract works");

  } catch (error) {
    console.log(`❌ WETH contract test failed: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 