const { ethers } = require("hardhat");

async function main() {
  console.log("✅ Approving WETH for OFT Adapter...");

  const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Ethereum Sepolia WETH
  const WETH_OFT_ADDRESS = "0x2F26C64514f40833F5b01e1FeEB2db35167a1028"; // Ethereum Sepolia WETH OFT

  const WETH_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
  ];

  const [signer] = await ethers.getSigners();
  const walletAddress = signer.address;
  console.log(`👤 Wallet address: ${walletAddress}`);

  const wethContract = await ethers.getContractAt(WETH_ABI, WETH_ADDRESS);

  // Check current balances and allowance
  const wethBalance = await wethContract.balanceOf(walletAddress);
  const currentAllowance = await wethContract.allowance(walletAddress, WETH_OFT_ADDRESS);

  console.log(`🪙 WETH balance: ${ethers.utils.formatEther(wethBalance)} WETH`);
  console.log(`📋 Current allowance: ${ethers.utils.formatEther(currentAllowance)} WETH`);

  if (wethBalance.eq(0)) {
    console.log("❌ No WETH tokens to approve. Please wrap ETH first.");
    return;
  }

  // Approve maximum amount for convenience
  console.log(`\n✅ Approving maximum WETH for OFT Adapter...`);
  const tx = await wethContract.approve(WETH_OFT_ADDRESS, ethers.constants.MaxUint256);
  console.log(`⏳ Transaction hash: ${tx.hash}`);
  
  await tx.wait();
  console.log("✅ WETH approved successfully!");

  // Check new allowance
  const newAllowance = await wethContract.allowance(walletAddress, WETH_OFT_ADDRESS);
  console.log(`\n📊 New allowance: ${ethers.utils.formatEther(newAllowance)} WETH`);

  console.log(`\n🚀 Ready to bridge WETH! The OFT Adapter can now spend your WETH tokens.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 