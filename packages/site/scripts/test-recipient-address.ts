import { publicClients, WETH_ADDRESSES } from '../lib/metamask-utils';
import { ethers } from 'ethers';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`${colors.bold}${colors.blue}🔍 ${msg}${colors.reset}`),
};

// Test recipient address validity
async function testRecipientAddress(address: string) {
  log.header(`Testing recipient address: ${address}`);
  console.log('');

  // Validate address format
  if (!ethers.isAddress(address)) {
    log.error('Invalid Ethereum address format!');
    return false;
  }

  log.success('✅ Address format is valid');

  // Test on Optimism Sepolia (where WETH will be delivered)
  const client = publicClients.optimismSepolia;
  const wethAddress = WETH_ADDRESSES.optimismSepolia;

  try {
    // Check if address is a contract
    const code = await client.getBytecode({ address: address as `0x${string}` });
    
    if (code && code !== '0x') {
      log.warning('⚠️  Address is a contract');
      console.log(`${colors.dim}   Bytecode length: ${code.length} characters${colors.reset}`);
      
      // Check if it's a potential proxy or has receive/fallback functions
      if (code.length > 100) {
        log.info('📝 Contract has substantial bytecode - checking capabilities...');
        
        // Try to see if it can receive ETH
        try {
          const balance = await client.getBalance({ address: address as `0x${string}` });
          log.info(`💰 Current ETH balance: ${ethers.formatEther(balance)} ETH`);
        } catch {
          log.warning('⚠️  Could not check ETH balance');
        }
      }
    } else {
      log.success('✅ Address is an EOA (Externally Owned Account)');
    }

    // Check WETH balance
    const wethAbi = [
      'function balanceOf(address) external view returns (uint256)',
      'function transfer(address to, uint256 amount) external returns (bool)'
    ];

    try {
      const balance = await client.readContract({
        address: wethAddress as `0x${string}`,
        abi: wethAbi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      log.info(`💰 Current WETH balance: ${ethers.formatEther(balance)} WETH`);
    } catch (error) {
      log.error(`❌ Could not check WETH balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test bytes32 encoding (how LayerZero encodes addresses)
    const bytes32Address = ethers.zeroPadValue(address, 32);
    log.info(`📝 Bytes32 encoding: ${bytes32Address}`);
    
    // Decode back to verify
    const decodedAddress = ethers.getAddress('0x' + bytes32Address.slice(-40));
    if (decodedAddress.toLowerCase() === address.toLowerCase()) {
      log.success('✅ Bytes32 encoding/decoding works correctly');
    } else {
      log.error('❌ Bytes32 encoding/decoding failed!');
      console.log(`${colors.dim}   Original: ${address}${colors.reset}`);
      console.log(`${colors.dim}   Decoded:  ${decodedAddress}${colors.reset}`);
    }

    return true;

  } catch (error) {
    log.error(`❌ Error testing address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

// Test alternative recipient addresses
async function suggestAlternatives() {
  log.header('🎯 Suggesting test alternatives...');
  console.log('');

  // Test with your sender address (should definitely work)
  const senderAddress = '0xd836D2c9a6e014c2056093BdC4FaA7343CAe80c9';
  log.info('Testing with sender address (guaranteed to work):');
  console.log(`${colors.dim}   ${senderAddress}${colors.reset}`);
  
  await testRecipientAddress(senderAddress);
  console.log('');

  // Suggest using a simple test address
  log.info('💡 Recommended test addresses:');
  console.log(`${colors.dim}   1. Your sender: ${senderAddress}${colors.reset}`);
  console.log(`${colors.dim}   2. Vitalik's: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045${colors.reset}`);
  console.log(`${colors.dim}   3. Create new wallet for testing${colors.reset}`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`${colors.bold}🧪 Recipient Address Tester${colors.reset}`);
    console.log('');
    console.log('Tests if an address can receive WETH on Optimism Sepolia');
    console.log('');
    console.log('Usage:');
    console.log('  npm run test-recipient <address>');
    console.log('');
    console.log('Example:');
    console.log('  npm run test-recipient 0xB6Fcc3D2F53affEca1c7F1D73ee2C63fb7042acC');
    console.log('');
    return;
  }

  const address = args[0];
  
  console.log(`${colors.bold}🧪 WETH Recipient Address Tester${colors.reset}`);
  console.log(`${colors.dim}Testing on Optimism Sepolia...${colors.reset}`);
  console.log('');
  
  const isValid = await testRecipientAddress(address);
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  if (!isValid) {
    await suggestAlternatives();
  } else {
    log.success('🎉 Address appears to be valid for receiving WETH!');
    console.log('');
    log.info('💡 If LayerZero is still failing, the issue might be:');
    console.log(`${colors.dim}   1. LayerZero configuration on the destination chain${colors.reset}`);
    console.log(`${colors.dim}   2. WETH contract compatibility issues${colors.reset}`);
    console.log(`${colors.dim}   3. Network-specific requirements${colors.reset}`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { testRecipientAddress }; 