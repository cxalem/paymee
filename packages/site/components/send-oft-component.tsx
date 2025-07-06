"use client";

import { useState } from "react";
import { sendOFTServerAction, SendOFTParams, SendOFTResult } from "../app/actions/send-oft";

export default function SendOFTServerComponent() {
  const [params, setParams] = useState<SendOFTParams>({
    srcEid: 40161, // Ethereum Sepolia
    dstEid: 11155420, // Optimism Sepolia
    amount: "1",
    to: "",
  });
  const [result, setResult] = useState<SendOFTResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await sendOFTServerAction(params);
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

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Cross-Chain Token Transfer</h2>
      
      {/* Important Notice */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notice</h3>
        <p className="text-yellow-700 text-sm mb-3">
          This transfers <strong>PAYMEE tokens</strong> (your custom OFT), not Sepolia ETH.
        </p>
        <div className="text-sm text-yellow-700">
          <p className="font-medium mb-1">To send Sepolia ETH instead:</p>
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
              <strong>LayerZero Testnet Bridge:</strong>{" "}
              <a 
                href="https://testnetbridge.com/sepolia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                testnetbridge.com/sepolia
              </a>
            </li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Chain
            </label>
            <select
              value={params.srcEid}
              onChange={(e) => setParams({ ...params, srcEid: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={40161}>Ethereum Sepolia (40161)</option>
              <option value={11155420}>Optimism Sepolia (11155420)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Chain
            </label>
            <select
              value={params.dstEid}
              onChange={(e) => setParams({ ...params, dstEid: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={40161}>Ethereum Sepolia (40161)</option>
              <option value={11155420}>Optimism Sepolia (11155420)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (PAYMEE Tokens)
          </label>
          <input
            type="text"
            value={params.amount}
            onChange={(e) => setParams({ ...params, amount: e.target.value })}
            placeholder="1.0"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            You have 1000 PAYMEE tokens available for testing
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={params.to}
            onChange={(e) => setParams({ ...params, to: e.target.value })}
            placeholder="0x..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            OFT Contract Address (Optional)
          </label>
          <input
            type="text"
            value={params.oftAddress || ""}
            onChange={(e) => setParams({ ...params, oftAddress: e.target.value || undefined })}
            placeholder="Use default deployed contract"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Amount (Optional)
          </label>
          <input
            type="text"
            value={params.minAmount || ""}
            onChange={(e) => setParams({ ...params, minAmount: e.target.value || undefined })}
            placeholder="Same as amount"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending PAYMEE Tokens..." : "Send PAYMEE Tokens"}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 rounded-md">
          {result.success ? (
            <div className="bg-green-50 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Transfer Successful!</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Transaction Hash:</strong>{" "}
                  <code className="bg-green-100 px-2 py-1 rounded text-green-800">
                    {result.txHash}
                  </code>
                </p>
                {result.scanLink && (
                  <p>
                    <strong>LayerZero Scan:</strong>{" "}
                    <a
                      href={result.scanLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View on LayerZero Scan
                    </a>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Transfer Failed</h3>
              <p className="text-sm text-red-700">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 