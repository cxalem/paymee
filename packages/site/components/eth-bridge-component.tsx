"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { Options } from "@layerzerolabs/lz-v2-utilities";

// ABI imports
import WETH_ABI from "../lib/abis/WETH.json";
import WETH_OFT_ABI from "../lib/abis/WETHOFTAdapter.json";

// Contract addresses for WETH OFT Adapters
const WETH_OFT_ADDRESSES = {
  ethereum: "0x2F26C64514f40833F5b01e1FeEB2db35167a1028", // Ethereum Sepolia
  optimism: "0x1b421839E647953739D30e2EE06eb80b8A141BAB", // Optimism Sepolia
};

// WETH contract addresses
const WETH_ADDRESSES = {
  ethereum: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Ethereum Sepolia
  optimism: "0x4200000000000000000000000000000000000006", // Optimism Sepolia
};

// Chain endpoint IDs
const CHAIN_IDS = {
  ethereum: 40161, // Ethereum Sepolia
  optimism: 11155420, // Optimism Sepolia
};



interface BridgeState {
  fromChain: "ethereum" | "optimism";
  toChain: "ethereum" | "optimism";
  amount: string;
  recipient: string;
  isLoading: boolean;
  txHash: string | null;
  error: string | null;
}

export default function ETHBridgeComponent() {
  const [state, setState] = useState<BridgeState>({
    fromChain: "ethereum",
    toChain: "optimism",
    amount: "",
    recipient: "",
    isLoading: false,
    txHash: null,
    error: null,
  });

  const updateState = (updates: Partial<BridgeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const switchChains = () => {
    updateState({
      fromChain: state.toChain,
      toChain: state.fromChain,
    });
  };

  const getProvider = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }
    return new ethers.BrowserProvider(window.ethereum);
  };

  const connectWallet = async () => {
    try {
      const provider = await getProvider();
      await provider.send("eth_requestAccounts", []);
      return provider;
    } catch {
      throw new Error("Failed to connect wallet");
    }
  };

  const bridgeETH = async () => {
    if (!state.amount || !state.recipient) {
      updateState({ error: "Please fill in all fields" });
      return;
    }

    try {
      updateState({ isLoading: true, error: null, txHash: null });

      const provider = await connectWallet();
      const signer = await provider.getSigner();
      
      // Get contract addresses
      const wethOftAddress = WETH_OFT_ADDRESSES[state.fromChain];
      const wethAddress = WETH_ADDRESSES[state.fromChain];
      const dstEid = CHAIN_IDS[state.toChain];
      
      // Create contract instances
      const wethOftContract = new ethers.Contract(wethOftAddress, WETH_OFT_ABI, signer);
      const wethContract = new ethers.Contract(wethAddress, WETH_ABI, signer);
      
      // Convert amount to wei
      const amountWei = ethers.parseEther(state.amount);
      
      // Convert recipient address to bytes32
      const recipientBytes32 = ethers.zeroPadValue(state.recipient, 32);
      
      // Prepare send parameters with proper execution options
      const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0); // 200k gas, 0 value
      const sendParam = {
        dstEid,
        to: recipientBytes32,
        amountLD: amountWei,
        minAmountLD: amountWei, // No slippage for exact amount
        extraOptions: options.toHex(),
        composeMsg: "0x",
        oftCmd: "0x",
      };
      
      // Get quote for the transaction
      const quote = await wethOftContract.quoteSend(sendParam, false);
      const nativeFee = quote.nativeFee;
      
      console.log(`Bridging ${state.amount} ETH from ${state.fromChain} to ${state.toChain}`);
      console.log(`LayerZero fee: ${ethers.formatEther(nativeFee)} ETH`);
      
      // Step 1: Wrap ETH to WETH
      console.log("Step 1: Wrapping ETH to WETH...");
      const wrapTx = await wethOftContract.wrapETH({ value: amountWei });
      await wrapTx.wait();
      
      // Step 2: Approve WETH for OFT Adapter (if not already approved)
      console.log("Step 2: Checking WETH approval...");
      const allowance = await wethContract.allowance(await signer.getAddress(), wethOftAddress);
      if (allowance < amountWei) {
        console.log("Approving WETH...");
        const approveTx = await wethContract.approve(wethOftAddress, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      // Step 3: Send WETH cross-chain
      console.log("Step 3: Sending WETH cross-chain...");
             const fee = { nativeFee, lzTokenFee: BigInt(0) };
      const userAddress = await signer.getAddress();
      
      const tx = await wethOftContract.send(
        sendParam,
        fee,
        userAddress, // refundTo
        { value: nativeFee }
      );
      
      updateState({ txHash: tx.hash });
      
      // Wait for confirmation
      await tx.wait();
      
      updateState({ 
        isLoading: false,
        amount: "",
        recipient: "",
      });
      
    } catch (bridgeError) {
      console.error("Bridge error:", bridgeError);
      updateState({ 
        error: bridgeError instanceof Error ? bridgeError.message : "Bridge failed",
        isLoading: false 
      });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        🌉 ETH Cross-Chain Bridge
      </h2>
      
      {/* Technical Issues Warning */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Configuration Issue</h3>
        <p className="text-yellow-700 text-sm mb-3">
          ETH bridging is unavailable due to missing LayerZero DefaultSendLib configuration (LZ_DefaultSendLibUnavailable).
        </p>
        <div className="text-sm text-yellow-700">
          <p className="font-medium mb-1">Alternative options:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Official Optimism Bridge:</strong>{" "}
              <a 
                href="https://app.optimism.io/bridge" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                app.optimism.io/bridge
              </a>
            </li>
            <li>
              <strong>Try PAYMEE token transfer</strong> (uses same LayerZero infrastructure)
            </li>
          </ul>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Chain Selection */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="font-semibold text-gray-700">From</div>
            <div className="text-lg font-bold text-blue-600 capitalize">
              {state.fromChain}
            </div>
          </div>
          
          <button
            onClick={switchChains}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={state.isLoading}
          >
            ↔️ Switch
          </button>
          
          <div className="text-center">
            <div className="font-semibold text-gray-700">To</div>
            <div className="text-lg font-bold text-green-600 capitalize">
              {state.toChain}
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={state.amount}
            onChange={(e) => updateState({ amount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.1"
            disabled={state.isLoading}
          />
        </div>

        {/* Recipient Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={state.recipient}
            onChange={(e) => updateState({ recipient: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0x..."
            disabled={state.isLoading}
          />
        </div>

        {/* Bridge Button */}
        <button
          onClick={bridgeETH}
          disabled={state.isLoading || !state.amount || !state.recipient}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {state.isLoading ? "Bridging..." : "🚀 Bridge ETH"}
        </button>

        {/* Status Messages */}
        {state.error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            ❌ {state.error}
          </div>
        )}

        {state.txHash && (
          <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            ✅ Transaction submitted!
            <br />
            <a
              href={`https://${state.fromChain === "ethereum" ? "sepolia." : "sepolia-optimism."}etherscan.io/tx/${state.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on Explorer →
            </a>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• ETH is automatically wrapped to WETH for bridging</p>
          <p>• WETH is automatically unwrapped to ETH on destination</p>
          <p>• LayerZero fees are paid in native ETH</p>
        </div>
      </div>
    </div>
  );
} 