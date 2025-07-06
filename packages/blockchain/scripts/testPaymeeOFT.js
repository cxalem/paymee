const { ethers } = require("hardhat");
const { Options } = require("@layerzerolabs/lz-v2-utilities");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`🔑 Using signer: ${signer.address}`);

  // PAYMEE OFT contract addresses
  const PAYMEE_OFT_ADDRESS = "0x7a411471724e12Bd057652B1FF7c52c068e1C9b7";

  // Create contract instance
  const paymeeOft = await ethers.getContractAt("PayMee", PAYMEE_OFT_ADDRESS);

  // Check balance
  const balance = await paymeeOft.balanceOf(signer.address);
  console.log(`PAYMEE balance: ${ethers.utils.formatEther(balance)} PAYMEE`);

  if (balance.eq(0)) {
    console.log("❌ No PAYMEE tokens to test with");
    return;
  }

  // Test parameters
  const dstEid = 11155420; // Optimism Sepolia
  const amount = ethers.utils.parseEther("1"); // 1 PAYMEE
  const recipientBytes32 = ethers.utils.hexZeroPad(signer.address, 32);

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

  console.log(`\n🧪 Testing PAYMEE OFT with ${ethers.utils.formatEther(amount)} PAYMEE`);

  try {
    console.log("💰 Attempting quoteSend...");
    const quote = await paymeeOft.quoteSend(sendParam, false);
    console.log(`✅ PAYMEE Quote successful!`);
    console.log(`Native fee: ${ethers.utils.formatEther(quote.nativeFee)} ETH`);
    console.log(`LZ token fee: ${quote.lzTokenFee.toString()}`);
  } catch (error) {
    console.error("❌ PAYMEE Quote failed:", error.message);
    console.error("Error data:", error.data);
    
    if (error.data) {
      console.log(`Error signature: ${error.data.slice(0, 10)}`);
    }
  }

  // Check contract info
  try {
    const oftVersion = await paymeeOft.oftVersion();
    console.log(`\n📊 PAYMEE OFT version: ${oftVersion}`);
  } catch (error) {
    console.error("❌ Error getting PAYMEE OFT version:", error.message);
  }

  try {
    const oAppVersion = await paymeeOft.oAppVersion();
    console.log(`📊 PAYMEE OApp version: ${oAppVersion}`);
  } catch (error) {
    console.error("❌ Error getting PAYMEE OApp version:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 