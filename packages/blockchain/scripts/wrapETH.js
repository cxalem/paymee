const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Wrapping ETH to WETH...");

  const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Ethereum Sepolia WETH

  const WETH_ABI = [
    "function deposit() external payable",
    "function balanceOf(address account) external view returns (uint256)",
    "function withdraw(uint256 amount) external",
  ];

  const [signer] = await ethers.getSigners();
  const walletAddress = signer.address;
  console.log(`👤 Wallet address: ${walletAddress}`);

  // Check current balances
  const ethBalance = await ethers.provider.getBalance(walletAddress);
  console.log(`💰 Current ETH balance: ${ethers.utils.formatEther(ethBalance)} ETH`);

  const wethContract = await ethers.getContractAt(WETH_ABI, WETH_ADDRESS);
  const wethBalanceBefore = await wethContract.balanceOf(walletAddress);
  console.log(`🪙 Current WETH balance: ${ethers.utils.formatEther(wethBalanceBefore)} WETH`);

  // Amount to wrap (0.1 ETH)
  const amountToWrap = ethers.utils.parseEther("0.1");
  console.log(`\n🔄 Wrapping ${ethers.utils.formatEther(amountToWrap)} ETH to WETH...`);

  // Check if we have enough ETH
  if (ethBalance.lt(amountToWrap.add(ethers.utils.parseEther("0.05")))) { // Keep 0.05 ETH for gas
    console.log("❌ Insufficient ETH balance for wrapping + gas fees");
    return;
  }

  // Wrap ETH to WETH
  const tx = await wethContract.deposit({ value: amountToWrap });
  console.log(`⏳ Transaction hash: ${tx.hash}`);
  
  await tx.wait();
  console.log("✅ ETH wrapped successfully!");

  // Check new balances
  const ethBalanceAfter = await ethers.provider.getBalance(walletAddress);
  const wethBalanceAfter = await wethContract.balanceOf(walletAddress);

  console.log(`\n📊 Updated balances:`);
  console.log(`💰 ETH balance: ${ethers.utils.formatEther(ethBalanceAfter)} ETH`);
  console.log(`🪙 WETH balance: ${ethers.utils.formatEther(wethBalanceAfter)} WETH`);

  console.log(`\n✅ You now have ${ethers.utils.formatEther(wethBalanceAfter)} WETH to bridge!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 