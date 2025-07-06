import { getWETHBalance, getETHBalance, WETH_ADDRESSES, publicClients } from '../lib/metamask-utils';
import { createPublicClient, http, formatEther } from 'viem';
import { sepolia, optimismSepolia } from 'viem/chains';

// LayerZero endpoint IDs to match your send action
const LZ_ENDPOINT_IDS = {
  40161: 'sepolia',
  40232: 'optimismSepolia',
} as const;

// WETH OFT Adapter addresses (from your send action)
const WETH_OFT_ADDRESSES = {
  sepolia: "0x2F26C64514f40833F5b01e1FeEB2db35167a1028",
  optimismSepolia: "0x1b421839E647953739D30e2EE06eb80b8A141BAB",
} as const;

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
  debug: (msg: string) => console.log(`${colors.cyan}🐛 ${msg}${colors.reset}`),
  balance: (token: string, amount: string, network: string) => 
    console.log(`${colors.green}💰 ${token}: ${colors.bold}${amount}${colors.reset} ${colors.dim}(${network})${colors.reset}`),
};

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Get recent WETH transfers
async function getRecentWETHTransfers(address: string, network: 'sepolia' | 'optimismSepolia') {
  const client = publicClients[network];
  const wethAddress = WETH_ADDRESSES[network];
  const networkName = network === 'sepolia' ? 'Ethereum Sepolia' : 'Optimism Sepolia';
  
  try {
    log.debug(`Checking recent WETH transfers on ${networkName}...`);
    
    // Get recent blocks (last 1000 blocks)
    const latestBlock = await client.getBlockNumber();
    const fromBlock = latestBlock - BigInt(1000);
    
    // Get transfer events where the address is the recipient (to parameter)
    const logs = await client.getLogs({
      address: wethAddress as `0x${string}`,
      event: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false },
        ],
      },
      args: {
        to: address as `0x${string}`,
      },
      fromBlock,
      toBlock: 'latest',
    });

    if (logs.length > 0) {
      log.success(`Found ${logs.length} recent WETH transfer(s) TO ${address} on ${networkName}:`);
      for (const logEntry of logs.slice(-5)) { // Show last 5 transfers
        const value = formatEther(logEntry.args.value || BigInt(0));
        console.log(`${colors.dim}   Block ${logEntry.blockNumber}: +${value} WETH from ${logEntry.args.from}${colors.reset}`);
        console.log(`${colors.dim}   Tx: ${logEntry.transactionHash}${colors.reset}`);
      }
    } else {
      log.warning(`No recent WETH transfers found TO ${address} on ${networkName}`);
    }

    // Also check transfers FROM the address
    const outgoingLogs = await client.getLogs({
      address: wethAddress as `0x${string}`,
      event: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false },
        ],
      },
      args: {
        from: address as `0x${string}`,
      },
      fromBlock,
      toBlock: 'latest',
    });

    if (outgoingLogs.length > 0) {
      log.info(`Found ${outgoingLogs.length} recent WETH transfer(s) FROM ${address} on ${networkName}:`);
      for (const logEntry of outgoingLogs.slice(-5)) {
        const value = formatEther(logEntry.args.value || BigInt(0));
        console.log(`${colors.dim}   Block ${logEntry.blockNumber}: -${value} WETH to ${logEntry.args.to}${colors.reset}`);
        console.log(`${colors.dim}   Tx: ${logEntry.transactionHash}${colors.reset}`);
      }
    }

    console.log('');
    
  } catch (error) {
    log.error(`Failed to check transfers on ${networkName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check OFT events (LayerZero bridge events)
async function checkOFTEvents(address: string, network: 'sepolia' | 'optimismSepolia') {
  const client = publicClients[network];
  const oftAddress = WETH_OFT_ADDRESSES[network];
  const networkName = network === 'sepolia' ? 'Ethereum Sepolia' : 'Optimism Sepolia';
  
  try {
    log.debug(`Checking LayerZero OFT events on ${networkName}...`);
    
    const latestBlock = await client.getBlockNumber();
    const fromBlock = latestBlock - BigInt(1000);
    
    // Check for OFTReceived events
    const logs = await client.getLogs({
      address: oftAddress as `0x${string}`,
      event: {
        type: 'event',
        name: 'OFTReceived',
        inputs: [
          { name: 'guid', type: 'bytes32', indexed: true },
          { name: 'srcEid', type: 'uint32', indexed: false },
          { name: 'toAddress', type: 'address', indexed: true },
          { name: 'amountReceivedLD', type: 'uint256', indexed: false },
        ],
      },
      args: {
        toAddress: address as `0x${string}`,
      },
      fromBlock,
      toBlock: 'latest',
    });

    if (logs.length > 0) {
      log.success(`Found ${logs.length} OFT receive event(s) for ${address} on ${networkName}:`);
      for (const logEntry of logs) {
        const amount = formatEther(logEntry.args.amountReceivedLD || BigInt(0));
        console.log(`${colors.dim}   Block ${logEntry.blockNumber}: Received ${amount} WETH via LayerZero${colors.reset}`);
        console.log(`${colors.dim}   Tx: ${logEntry.transactionHash}${colors.reset}`);
      }
    } else {
      log.warning(`No OFT receive events found for ${address} on ${networkName}`);
    }

    console.log('');
    
  } catch (error) {
    log.error(`Failed to check OFT events on ${networkName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main debugging function
async function debugWETHBalance(walletAddress: string) {
  log.header(`🕵️ DEBUGGING WETH Balance for: ${walletAddress}`);
  console.log('');

  // Validate address
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    log.error('Invalid Ethereum address format');
    return;
  }

  console.log(`${colors.bold}📋 Contract Addresses:${colors.reset}`);
  console.log(`${colors.dim}Ethereum Sepolia WETH: ${WETH_ADDRESSES.sepolia}${colors.reset}`);
  console.log(`${colors.dim}Optimism Sepolia WETH: ${WETH_ADDRESSES.optimismSepolia}${colors.reset}`);
  console.log(`${colors.dim}Ethereum Sepolia OFT: ${WETH_OFT_ADDRESSES.sepolia}${colors.reset}`);
  console.log(`${colors.dim}Optimism Sepolia OFT: ${WETH_OFT_ADDRESSES.optimismSepolia}${colors.reset}`);
  console.log('');

  const networks: Array<'sepolia' | 'optimismSepolia'> = ['sepolia', 'optimismSepolia'];
  
  for (const network of networks) {
    const networkName = network === 'sepolia' ? 'Ethereum Sepolia' : 'Optimism Sepolia';
    
    log.info(`🔍 Analyzing ${networkName}...`);
    
    try {
      // Get current balances
      const [ethBalance, wethBalance] = await Promise.all([
        getETHBalance(walletAddress as `0x${string}`, network),
        getWETHBalance(walletAddress as `0x${string}`, network),
      ]);

      log.balance('ETH', ethBalance.formatted, networkName);
      log.balance('WETH', wethBalance.formatted, networkName);
      
      // Check recent transfers
      await getRecentWETHTransfers(walletAddress, network);
      
      // Check OFT events
      await checkOFTEvents(walletAddress, network);
      
    } catch (error) {
      log.error(`Failed to analyze ${networkName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`${colors.bold}🕵️ WETH Balance Debugger${colors.reset}`);
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx scripts/debug-weth-balance.ts <wallet-address>');
    console.log('');
    console.log('Example:');
    console.log('  npx tsx scripts/debug-weth-balance.ts 0xB6Fcc3D2F53affEca1c7F1D73ee2C63fb7042acC');
    console.log('');
    return;
  }

  const walletAddress = args[0];
  
  await debugWETHBalance(walletAddress);
  
  console.log(`${colors.dim}🎯 Debug complete! If you're still not seeing WETH, check:${colors.reset}`);
  console.log(`${colors.dim}   1. Make sure you're sending to the RIGHT network${colors.reset}`);
  console.log(`${colors.dim}   2. Check if transactions are actually succeeding${colors.reset}`);
  console.log(`${colors.dim}   3. Verify the recipient address is correct${colors.reset}`);
  console.log(`${colors.dim}   4. Wait for LayerZero message delivery (can take a few minutes)${colors.reset}`);
}

// Export for potential use as a module
export { debugWETHBalance };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    log.error(`Debug script failed: ${error.message}`);
    process.exit(1);
  });
} 