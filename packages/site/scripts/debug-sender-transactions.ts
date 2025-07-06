import { publicClients, WETH_ADDRESSES } from '../lib/metamask-utils';
import { formatEther } from 'viem';

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
};

// Get the sender wallet address from environment
function getSenderAddress(): string {
  const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('NEXT_PUBLIC_PRIVATE_KEY not found in environment');
  }
  
  // Create wallet from private key to get address
  const { ethers } = require('ethers');
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

// WETH OFT Adapter addresses
const WETH_OFT_ADDRESSES = {
  sepolia: "0x2F26C64514f40833F5b01e1FeEB2db35167a1028",
  optimismSepolia: "0x1b421839E647953739D30e2EE06eb80b8A141BAB",
} as const;

// Check recent transactions from sender
async function checkSenderTransactions(network: 'sepolia' | 'optimismSepolia') {
  const client = publicClients[network];
  const networkName = network === 'sepolia' ? 'Ethereum Sepolia' : 'Optimism Sepolia';
  const senderAddress = getSenderAddress();
  
  log.header(`Checking recent transactions from ${senderAddress} on ${networkName}`);
  
  try {
    // Get recent blocks
    const latestBlock = await client.getBlockNumber();
    const fromBlock = latestBlock - BigInt(1000);
    
    log.info(`Searching last 1000 blocks (${fromBlock} to ${latestBlock})...`);
    
    // Get all transactions from sender in recent blocks
    for (let blockNum = latestBlock; blockNum > fromBlock && blockNum > latestBlock - BigInt(50); blockNum--) {
      try {
        const block = await client.getBlock({ 
          blockNumber: blockNum,
          includeTransactions: true 
        });
        
        const senderTxs = block.transactions.filter(tx => 
          typeof tx === 'object' && tx.from?.toLowerCase() === senderAddress.toLowerCase()
        );
        
        if (senderTxs.length > 0) {
          log.success(`Found ${senderTxs.length} transaction(s) in block ${blockNum}:`);
          
          for (const tx of senderTxs) {
            if (typeof tx === 'object') {
              console.log(`${colors.dim}   📋 Hash: ${tx.hash}${colors.reset}`);
              console.log(`${colors.dim}   📍 To: ${tx.to}${colors.reset}`);
              console.log(`${colors.dim}   💰 Value: ${formatEther(tx.value || BigInt(0))} ETH${colors.reset}`);
              console.log(`${colors.dim}   ⛽ Gas: ${tx.gas?.toString()}${colors.reset}`);
              
              // Check if it's to our WETH OFT contract
              if (tx.to?.toLowerCase() === WETH_OFT_ADDRESSES[network].toLowerCase()) {
                log.warning(`   🎯 This is a WETH OFT transaction!`);
              }
              
              // Get transaction receipt for status
              try {
                const receipt = await client.getTransactionReceipt({ hash: tx.hash });
                const status = receipt.status === 'success' ? '✅ SUCCESS' : '❌ FAILED';
                console.log(`${colors.dim}   📊 Status: ${status}${colors.reset}`);
                
                if (receipt.status === 'reverted') {
                  log.error(`   💥 Transaction reverted!`);
                }
                
                // Check for LayerZero events in logs
                const oftLogs = receipt.logs.filter(logEntry => 
                  logEntry.address?.toLowerCase() === WETH_OFT_ADDRESSES[network].toLowerCase()
                );
                
                if (oftLogs.length > 0) {
                  log.info(`   📝 Found ${oftLogs.length} OFT contract log(s)`);
                }
                
              } catch (receiptError) {
                log.warning(`   ⚠️ Could not get receipt: ${receiptError instanceof Error ? receiptError.message : 'Unknown error'}`);
              }
              
              console.log('');
            }
          }
        }
      } catch (blockError) {
        // Skip blocks that might not exist or have issues
        continue;
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    log.error(`Failed to check transactions on ${networkName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check specific transaction hash
async function checkSpecificTransaction(txHash: string, network?: 'sepolia' | 'optimismSepolia') {
  log.header(`🔍 Analyzing transaction: ${txHash}`);
  
  const networks: Array<'sepolia' | 'optimismSepolia'> = network ? [network] : ['sepolia', 'optimismSepolia'];
  
  for (const net of networks) {
    const client = publicClients[net];
    const networkName = net === 'sepolia' ? 'Ethereum Sepolia' : 'Optimism Sepolia';
    
    try {
      log.info(`Checking on ${networkName}...`);
      
      const [tx, receipt] = await Promise.all([
        client.getTransaction({ hash: txHash as `0x${string}` }),
        client.getTransactionReceipt({ hash: txHash as `0x${string}` })
      ]);
      
      log.success(`Transaction found on ${networkName}!`);
      
      console.log(`${colors.bold}📋 Transaction Details:${colors.reset}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   To: ${tx.to}`);
      console.log(`   Value: ${formatEther(tx.value)} ETH`);
      console.log(`   Gas Used: ${receipt.gasUsed?.toString()}`);
      console.log(`   Status: ${receipt.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (receipt.status === 'reverted') {
        log.error('💥 Transaction was reverted!');
      }
      
      // Check if it's to WETH OFT contract
      if (tx.to?.toLowerCase() === WETH_OFT_ADDRESSES[net].toLowerCase()) {
        log.info('🎯 This is a WETH OFT transaction');
        
        // Look for OFT events
        const oftEvents = receipt.logs.filter(logEntry => 
          logEntry.address?.toLowerCase() === WETH_OFT_ADDRESSES[net].toLowerCase()
        );
        
        if (oftEvents.length > 0) {
          log.success(`Found ${oftEvents.length} OFT event(s):`);
          oftEvents.forEach((logEntry, index) => {
            console.log(`   📝 Log ${index + 1}: ${logEntry.topics[0]}`);
          });
        }
      }
      
      console.log('');
      break;
      
    } catch (error) {
      log.warning(`Transaction not found on ${networkName}`);
    }
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  try {
    const senderAddress = getSenderAddress();
    console.log(`${colors.bold}🕵️ WETH Sender Transaction Debugger${colors.reset}`);
    console.log(`${colors.dim}Sender wallet: ${senderAddress}${colors.reset}`);
    console.log('');
    
    if (args.length > 0) {
      // Check specific transaction hash
      const txHash = args[0];
      const network = args[1] as 'sepolia' | 'optimismSepolia' | undefined;
      await checkSpecificTransaction(txHash, network);
    } else {
      // Check recent transactions from sender
      log.info('Checking recent transactions from sender wallet...');
      console.log('');
      
      await checkSenderTransactions('sepolia');
      console.log('');
      await checkSenderTransactions('optimismSepolia');
    }
    
    console.log(`${colors.dim}💡 Usage:${colors.reset}`);
    console.log(`${colors.dim}   Check recent: npm run debug-sender${colors.reset}`);
    console.log(`${colors.dim}   Check specific tx: npm run debug-sender <tx-hash> [network]${colors.reset}`);
    
  } catch (error) {
    log.error(`Script failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    if (error instanceof Error && error.message.includes('NEXT_PUBLIC_PRIVATE_KEY')) {
      console.log('');
      log.warning('Make sure NEXT_PUBLIC_PRIVATE_KEY is set in your environment');
      log.info('Create a .env.local file with: NEXT_PUBLIC_PRIVATE_KEY=your_private_key_here');
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Script crashed:', error);
    process.exit(1);
  });
}

export { checkSenderTransactions, checkSpecificTransaction }; 