import { getWETHBalance, getETHBalance, WETH_ADDRESSES } from '../lib/metamask-utils';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

// Helper function to format console output
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`${colors.bold}${colors.blue}🔍 ${msg}${colors.reset}`),
  balance: (token: string, amount: string, network: string) => 
    console.log(`${colors.green}💰 ${token}: ${colors.bold}${amount}${colors.reset} ${colors.dim}(${network})${colors.reset}`),
};

// Validate Ethereum address
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Main function to check WETH balance
async function checkWETHBalance(walletAddress: string) {
  log.header(`Checking WETH Balance for: ${walletAddress}`);
  console.log('');

  // Validate address
  if (!isValidEthereumAddress(walletAddress)) {
    log.error('Invalid Ethereum address format');
    return;
  }

  const networks: Array<'sepolia' | 'optimismSepolia'> = ['sepolia', 'optimismSepolia'];
  
  for (const network of networks) {
    const networkName = network === 'sepolia' ? 'Ethereum Sepolia' : 'Optimism Sepolia';
    
    log.info(`Fetching balances on ${networkName}...`);
    
    try {
      // Get both ETH and WETH balances
      const [ethBalance, wethBalance] = await Promise.all([
        getETHBalance(walletAddress as `0x${string}`, network),
        getWETHBalance(walletAddress as `0x${string}`, network),
      ]);

      // Display results
      log.balance('ETH', ethBalance.formatted, networkName);
      log.balance('WETH', wethBalance.formatted, networkName);
      
      // Show contract address for reference
      console.log(`${colors.dim}   Contract: ${WETH_ADDRESSES[network]}${colors.reset}`);
      console.log('');

      // Check if wallet has any WETH
      if (parseFloat(wethBalance.formatted) > 0) {
        log.success(`Found ${wethBalance.formatted} WETH on ${networkName}!`);
      } else {
        log.warning(`No WETH balance found on ${networkName}`);
      }
      
      console.log('');
      
    } catch (error) {
      log.error(`Failed to fetch balances on ${networkName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('');
    }
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`${colors.bold}WETH Balance Checker${colors.reset}`);
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx scripts/check-weth-balance.ts <wallet-address>');
    console.log('');
    console.log('Example:');
    console.log('  npx tsx scripts/check-weth-balance.ts 0xB6Fcc3D2F53affEca1c7F1D73ee2C63fb7042acC');
    console.log('');
    return;
  }

  const walletAddress = args[0];
  
  console.log(`${colors.bold}🌐 WETH Balance Checker${colors.reset}`);
  console.log(`${colors.dim}Checking balances across testnets...${colors.reset}`);
  console.log('');
  
  await checkWETHBalance(walletAddress);
  
  console.log(`${colors.dim}✨ Check complete!${colors.reset}`);
}

// Export for potential use as a module
export { checkWETHBalance };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  });
} 