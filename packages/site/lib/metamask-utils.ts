import { createPublicClient, http, formatEther } from 'viem';
import { sepolia, optimismSepolia } from 'viem/chains';

// WETH contract addresses
export const WETH_ADDRESSES = {
  sepolia: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  optimismSepolia: '0x4200000000000000000000000000000000000006',
} as const;

// WETH OFT Adapter addresses
export const WETH_OFT_ADDRESSES = {
  sepolia: '0x2F26C64514f40833F5b01e1FeEB2db35167a1028',
  optimismSepolia: '0x1b421839E647953739D30e2EE06eb80b8A141BAB',
} as const;

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Viem public clients
export const publicClients = {
  sepolia: createPublicClient({
    chain: sepolia,
    transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
  }),
  optimismSepolia: createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io'),
  }),
};

/**
 * Add WETH token to MetaMask
 */
export async function addWETHToMetaMask(network: 'sepolia' | 'optimismSepolia') {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const tokenAddress = WETH_ADDRESSES[network];
  
  try {
    await (window as any).ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol: 'WETH',
          decimals: 18,
          image: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png', // WETH logo
        },
      },
    });
    
    console.log('WETH token added to MetaMask successfully');
    return true;
  } catch (error) {
    console.error('Error adding WETH token to MetaMask:', error);
    return false;
  }
}

/**
 * Get WETH balance using viem
 */
export async function getWETHBalance(
  address: `0x${string}`,
  network: 'sepolia' | 'optimismSepolia'
): Promise<{ balance: string; formatted: string }> {
  const client = publicClients[network];
  const tokenAddress = WETH_ADDRESSES[network];

  try {
    const balance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    const formatted = formatEther(balance);

    return {
      balance: balance.toString(),
      formatted,
    };
  } catch (error) {
    console.error('Error fetching WETH balance:', error);
    throw error;
  }
}

/**
 * Get native ETH balance using viem
 */
export async function getETHBalance(
  address: `0x${string}`,
  network: 'sepolia' | 'optimismSepolia'
): Promise<{ balance: string; formatted: string }> {
  const client = publicClients[network];

  try {
    const balance = await client.getBalance({
      address,
    });

    const formatted = formatEther(balance);

    return {
      balance: balance.toString(),
      formatted,
    };
  } catch (error) {
    console.error('Error fetching ETH balance:', error);
    throw error;
  }
}

/**
 * Get both ETH and WETH balances
 */
export async function getAllBalances(
  address: `0x${string}`,
  network: 'sepolia' | 'optimismSepolia'
) {
  try {
    const [ethBalance, wethBalance] = await Promise.all([
      getETHBalance(address, network),
      getWETHBalance(address, network),
    ]);

    return {
      eth: ethBalance,
      weth: wethBalance,
    };
  } catch (error) {
    console.error('Error fetching balances:', error);
    throw error;
  }
}

/**
 * Get token info using viem
 */
export async function getTokenInfo(
  tokenAddress: `0x${string}`,
  network: 'sepolia' | 'optimismSepolia'
) {
  const client = publicClients[network];

  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'name',
      }),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ]);

    return {
      name,
      symbol,
      decimals,
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}

// Types for MetaMask
interface MetaMaskEthereum {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
} 