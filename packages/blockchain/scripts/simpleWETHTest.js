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
  const wethBalance = await wethContract.balanceOf(signer.address);
  console.log(`WETH balance: ${ethers.utils.formatEther(wethBalance)} WETH`);

  // Try with a very small amount first
  const smallAmount = ethers.utils.parseEther("0.001"); // 0.001 ETH
  
  if (wethBalance.lt(smallAmount)) {
    console.log("❌ Insufficient WETH balance for test");
    return;
  }

  const dstEid = 11155420; // Optimism Sepolia
  const recipientBytes32 = ethers.utils.hexZeroPad(signer.address, 32);

  // Prepare send parameters with minimal options
  const options = Options.newOptions().addExecutorLzReceiveOption(100000, 0); // Lower gas
  const sendParam = {
    dstEid,
    to: recipientBytes32,
    amountLD: smallAmount,
    minAmountLD: smallAmount,
    extraOptions: options.toHex(),
    composeMsg: "0x",
    oftCmd: "0x",
  };

  console.log(`\n🧪 Testing with ${ethers.utils.formatEther(smallAmount)} WETH`);

  try {
    console.log("💰 Attempting quoteSend...");
    const quote = await wethOftContract.quoteSend(sendParam, false);
    console.log(`✅ Quote successful!`);
    console.log(`Native fee: ${ethers.utils.formatEther(quote.nativeFee)} ETH`);
  } catch (error) {
    console.error("❌ Quote failed:", error.message);
    console.error("Error data:", error.data);
    
    // Try with even smaller amount
    const tinyAmount = ethers.utils.parseEther("0.0001"); // 0.0001 ETH
    
    if (wethBalance.gte(tinyAmount)) {
      console.log(`\n🧪 Trying with even smaller amount: ${ethers.utils.formatEther(tinyAmount)} WETH`);
      
      const tinyParams = {
        ...sendParam,
        amountLD: tinyAmount,
        minAmountLD: tinyAmount,
      };
      
      try {
        const tinyQuote = await wethOftContract.quoteSend(tinyParams, false);
        console.log(`✅ Tiny amount quote successful!`);
        console.log(`Native fee: ${ethers.utils.formatEther(tinyQuote.nativeFee)} ETH`);
      } catch (tinyError) {
        console.error("❌ Tiny amount quote also failed:", tinyError.message);
        console.error("Error data:", tinyError.data);
      }
    }
  }

  // Check if the OFT contract itself has any WETH balance
  const oftWethBalance = await wethContract.balanceOf(WETH_OFT_ADDRESS);
  console.log(`\n📊 OFT contract WETH balance: ${ethers.utils.formatEther(oftWethBalance)} WETH`);

  // Check if there are any issues with the underlying token
  try {
    const underlyingToken = await wethOftContract.token();
    console.log(`🪙 Underlying token: ${underlyingToken}`);
    console.log(`🔍 Expected WETH: ${WETH_ADDRESS}`);
    console.log(`✅ Token match: ${underlyingToken.toLowerCase() === WETH_ADDRESS.toLowerCase()}`);
  } catch (error) {
    console.error("❌ Error getting underlying token:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 