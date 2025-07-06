"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  addWETHToMetaMask, 
  getWETHBalance, 
  getETHBalance, 
  getAllBalances,
  WETH_ADDRESSES 
} from "@/lib/metamask-utils";

export function WETHBalanceComponent() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [balances, setBalances] = useState<{
    eth: { balance: string; formatted: string };
    weth: { balance: string; formatted: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<'sepolia' | 'optimismSepolia'>('sepolia');

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  // Add WETH token to MetaMask
  const addWETHToken = async () => {
    try {
      const success = await addWETHToMetaMask(selectedNetwork);
      if (success) {
        alert('WETH token added to MetaMask successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add token');
    }
  };

  // Fetch balances
  const fetchBalances = async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const balanceData = await getAllBalances(walletAddress as `0x${string}`, selectedNetwork);
      setBalances(balanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch balances when wallet connects or network changes
  useEffect(() => {
    if (walletAddress) {
      fetchBalances();
    }
  }, [walletAddress, selectedNetwork]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>WETH Balance & MetaMask Integration</CardTitle>
        <CardDescription>
          Add WETH to MetaMask and check your balances on testnets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Network Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Network</label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value as 'sepolia' | 'optimismSepolia')}
            className="w-full p-2 border rounded-md"
          >
            <option value="sepolia">Ethereum Sepolia</option>
            <option value="optimismSepolia">Optimism Sepolia</option>
          </select>
        </div>

        {/* Contract Address Display */}
        <div className="p-4 bg-gray-50 rounded-md">
          <p className="text-sm font-medium mb-2">WETH Contract Address:</p>
          <p className="text-xs font-mono bg-white p-2 rounded border break-all">
            {WETH_ADDRESSES[selectedNetwork]}
          </p>
        </div>

        {/* Wallet Connection */}
        {!walletAddress ? (
          <Button onClick={connectWallet} className="w-full">
            Connect MetaMask
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-md">
              <p className="text-sm font-medium text-green-800">Connected Wallet:</p>
              <p className="text-xs font-mono text-green-700 break-all">
                {walletAddress}
              </p>
            </div>

            {/* Add Token Button */}
            <Button onClick={addWETHToken} variant="outline" className="w-full">
              Add WETH Token to MetaMask
            </Button>

            {/* Balances */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Balances</h3>
                <Button onClick={fetchBalances} disabled={loading} size="sm">
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>

              {balances && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-800">ETH Balance</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {parseFloat(balances.eth.formatted).toFixed(4)}
                    </p>
                    <p className="text-xs text-blue-600">
                      {balances.eth.balance} wei
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-md">
                    <p className="text-sm font-medium text-purple-800">WETH Balance</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {parseFloat(balances.weth.formatted).toFixed(4)}
                    </p>
                    <p className="text-xs text-purple-600">
                      {balances.weth.balance} wei
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">❌ {error}</p>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Connect your MetaMask wallet</li>
            <li>2. Select the network (Sepolia or Optimism Sepolia)</li>
            <li>3. Click "Add WETH Token to MetaMask" to add the token</li>
            <li>4. Your balances will automatically load</li>
            <li>5. Use the refresh button to update balances</li>
          </ul>
        </div>

        {/* Code Example */}
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-2">Code Example:</h3>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            <code>{`import { getWETHBalance, addWETHToMetaMask } from '@/lib/metamask-utils';

// Add WETH to MetaMask
await addWETHToMetaMask('sepolia');

// Get WETH balance
const balance = await getWETHBalance(
  '0x...', // wallet address
  'sepolia' // network
);

console.log(\`WETH Balance: \${balance.formatted} WETH\`);`}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
} 