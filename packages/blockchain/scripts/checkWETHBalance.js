const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking WETH and ETH balances...");

  // Contract addresses
  const WETH_OFT_ADDRESSES = {
    ethereum: "0x2F26C64514f40833F5b01e1FeEB2db35167a1028", // Ethereum Sepolia
    optimism: "0x1b421839E647953739D30e2EE06eb80b8A141BAB", // Optimism Sepolia
  };

  const WETH_ADDRESSES = {
    ethereum: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Ethereum Sepolia
    optimism: "0x4200000000000000000000000000000000000006", // Optimism Sepolia
  };

  const WETH_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function deposit() external payable",
    "function allowance(address owner, address spender) external view returns (uint256)",
  ];

  const WETH_OFT_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function wrapETH() external payable",
  ];

  const networkName = hre.network.name;
  console.log(`📍 Current network: ${networkName}`);

  if (networkName === "ethereum-sepolia") {
    console.log("\n🔧 Checking balances on Ethereum Sepolia...");
    
    const [signer] = await ethers.getSigners();
    const walletAddress = signer.address;
    console.log(`👤 Wallet address: ${walletAddress}`);

    // Check ETH balance
    const ethBalance = await ethers.provider.getBalance(walletAddress);
    console.log(`💰 ETH balance: ${ethers.utils.formatEther(ethBalance)} ETH`);

    // Check WETH balance
    const wethContract = await ethers.getContractAt(WETH_ABI, WETH_ADDRESSES.ethereum);
    const wethBalance = await wethContract.balanceOf(walletAddress);
    console.log(`🪙 WETH balance: ${ethers.utils.formatEther(wethBalance)} WETH`);

    // Check WETH OFT balance (with error handling)
    try {
      const wethOftContract = await ethers.getContractAt(WETH_OFT_ABI, WETH_OFT_ADDRESSES.ethereum);
      const wethOftBalance = await wethOftContract.balanceOf(walletAddress);
      console.log(`🌉 WETH OFT balance: ${ethers.utils.formatEther(wethOftBalance)} WETH`);
    } catch (error) {
      console.log(`❌ Error checking WETH OFT balance: ${error.message}`);
    }

    // Check allowance
    try {
      const allowance = await wethContract.allowance(walletAddress, WETH_OFT_ADDRESSES.ethereum);
      console.log(`✅ WETH allowance for OFT: ${ethers.utils.formatEther(allowance)} WETH`);
    } catch (error) {
      console.log(`❌ Error checking WETH allowance: ${error.message}`);
    }

    // Recommendations
    console.log("\n💡 Recommendations:");
    if (ethBalance.lt(ethers.utils.parseEther("0.1"))) {
      console.log("❌ Low ETH balance - you need ETH for gas fees");
    }
    if (wethBalance.eq(0)) {
      console.log("❌ No WETH tokens - you need to wrap ETH first");
      console.log("   Run: wethContract.deposit({value: ethers.utils.parseEther('0.1')})");
    }

  } else {
    console.log("❌ This script is designed for ethereum-sepolia network");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 