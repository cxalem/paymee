const { ethers } = require("hardhat");
const { Options } = require("@layerzerolabs/lz-v2-utilities");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`🔑 Using signer: ${signer.address}`);

  // Contract addresses
  const WETH_OFT_ADDRESS = "0x2F26C64514f40833F5b01e1FeEB2db35167a1028";
  const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

  // Create contract instances
  const wethOftContract = await ethers.getContractAt("WETHOFTAdapter", WETH_OFT_ADDRESS);
  const wethContract = await ethers.getContractAt("IERC20", WETH_ADDRESS);

  // Check balances
  console.log("💰 Checking balances...");
  const ethBalance = await signer.getBalance();
  const wethBalance = await wethContract.balanceOf(signer.address);
  console.log(`ETH balance: ${ethers.utils.formatEther(ethBalance)} ETH`);
  console.log(`WETH balance: ${ethers.utils.formatEther(wethBalance)} WETH`);

  // Check allowance
  const allowance = await wethContract.allowance(signer.address, WETH_OFT_ADDRESS);
  console.log(`WETH allowance: ${ethers.utils.formatEther(allowance)} WETH`);

  // Test parameters
  const dstEid = 11155420; // Optimism Sepolia
  const amount = ethers.utils.parseEther("0.01"); // 0.01 ETH
  const recipient = signer.address;
  const recipientBytes32 = ethers.utils.hexZeroPad(recipient, 32);

  console.log(`\n🧪 Testing with:`);
  console.log(`Amount: ${ethers.utils.formatEther(amount)} ETH`);
  console.log(`Recipient: ${recipient}`);
  console.log(`Destination EID: ${dstEid}`);

  // Prepare send parameters
  const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0);
  const sendParam = {
    dstEid,
    to: recipientBytes32,
    amountLD: amount,
    minAmountLD: amount,
    extraOptions: options.toHex(),
    composeMsg: "0x",
    oftCmd: "0x",
  };

  console.log(`\n📋 Send parameters:`);
  console.log(`dstEid: ${sendParam.dstEid}`);
  console.log(`to: ${sendParam.to}`);
  console.log(`amountLD: ${sendParam.amountLD.toString()}`);
  console.log(`minAmountLD: ${sendParam.minAmountLD.toString()}`);
  console.log(`extraOptions: ${sendParam.extraOptions}`);

  // Try to quote the send
  console.log("\n💰 Attempting to quote send...");
  try {
    const quote = await wethOftContract.quoteSend(sendParam, false);
    console.log(`✅ Quote successful!`);
    console.log(`Native fee: ${ethers.utils.formatEther(quote.nativeFee)} ETH`);
    console.log(`LZ token fee: ${quote.lzTokenFee.toString()}`);
  } catch (error) {
    console.error("❌ Quote failed:", error.message);
    console.error("Error data:", error.data);
    
    // Try to decode the error
    if (error.data) {
      console.log(`Error signature: ${error.data.slice(0, 10)}`);
    }
  }

  // Check if the contract has the required functions
  console.log("\n🔍 Checking contract functions...");
  try {
    const oftVersion = await wethOftContract.oftVersion();
    console.log(`OFT version: ${oftVersion}`);
  } catch (error) {
    console.error("❌ Error getting OFT version:", error.message);
  }

  try {
    const oAppVersion = await wethOftContract.oAppVersion();
    console.log(`OApp version: ${oAppVersion}`);
  } catch (error) {
    console.error("❌ Error getting OApp version:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 