"use client";

import React, { useState } from "react";
import { sendETHServerAction, SendETHParams, SendETHResult } from "../app/actions/send-eth";

export default function SendETHServerComponent() {
  const [params, setParams] = useState<SendETHParams>({
    srcEid: 40161, // Ethereum Sepolia
    dstEid: 40232, 
    amount: "0.01",
    to: "",
  });
  const [result, setResult] = useState<SendETHResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await sendETHServerAction(params);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const switchChains = () => {
    setParams(prev => ({
      ...prev,
      srcEid: prev.dstEid,
      dstEid: prev.srcEid,
    }));
  };

  const getChainName = (eid: number) => {
    switch (eid) {
      case 40161: return "Ethereum Sepolia";
      case 11155420: return "Optimism Sepolia";
      default: return `Chain ${eid}`;
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        🌉 ETH Cross-Chain Bridge (Server)
      </h2>
      
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Server-side bridging:</strong> This uses your private key configured on the server 
          to automatically wrap ETH → WETH → send cross-chain. The recipient will receive WETH 
          that can be unwrapped to ETH.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Chain Selection */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="font-semibold text-gray-700">From</div>
            <div className="text-sm font-bold text-blue-600">
              {getChainName(params.srcEid)}
            </div>
          </div>
          
          <button
            type="button"
            onClick={switchChains}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            ↔️ Switch
          </button>
          
          <div className="text-center">
            <div className="font-semibold text-gray-700">To</div>
            <div className="text-sm font-bold text-green-600">
              {getChainName(params.dstEid)}
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
            value={params.amount}
            onChange={(e) => setParams(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={params.to}
            onChange={(e) => setParams(prev => ({ ...prev, to: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0x..."
            required
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "🔄 Bridging ETH..." : "🚀 Bridge ETH"}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.success 
            ? "bg-green-100 border border-green-300 text-green-700" 
            : "bg-red-100 border border-red-300 text-red-700"
        }`}>
          {result.success ? (
            <div>
              <div className="font-semibold mb-2">✅ ETH Bridge Successful!</div>
              <div className="text-sm space-y-1">
                <div><strong>Tx Hash:</strong> {result.txHash}</div>
                {result.scanUrl && (
                  <div>
                    <a 
                      href={result.scanUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on Explorer →
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="font-semibold mb-2">❌ Bridge Failed</div>
              <div className="text-sm">{result.error}</div>
            </div>
          )}
        </div>
      )}

      {/* Process Info */}
      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <div className="font-semibold text-gray-700 mb-2">Bridge Process:</div>
        <div>1. 🔄 ETH is wrapped to WETH</div>
        <div>2. ✅ WETH is approved for OFT Adapter</div>
        <div>3. 🚀 WETH is sent cross-chain via LayerZero</div>
        <div>4. 📦 Recipient receives WETH on destination chain</div>
        <div className="mt-2 text-yellow-600">
          💡 <strong>Note:</strong> Recipient will receive WETH, not ETH. They can unwrap WETH to ETH manually.
        </div>
      </div>
    </div>
  );
} 