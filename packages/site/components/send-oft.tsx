"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendOFT, ENDPOINT_IDS, getNetworkName, SendOFTParams } from "@/lib/sendOFT";

export function SendOFTComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ txHash: string; scanLink: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    srcEid: ENDPOINT_IDS.SEPOLIA,
    dstEid: ENDPOINT_IDS.MUMBAI,
    amount: "",
    to: "",
    oftAddress: "",
    minAmount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!formData.amount || !formData.to || !formData.oftAddress) {
        throw new Error("Please fill in all required fields");
      }

      const params: SendOFTParams = {
        srcEid: formData.srcEid,
        dstEid: formData.dstEid,
        amount: formData.amount,
        to: formData.to,
        oftAddress: formData.oftAddress,
        minAmount: formData.minAmount || undefined,
      };

      const result = await sendOFT(params);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send OFT Tokens Cross-Chain</CardTitle>
        <CardDescription>
          Transfer tokens between different blockchains using LayerZero OFT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Chain */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Chain</label>
            <select
              value={formData.srcEid}
              onChange={(e) => handleInputChange("srcEid", parseInt(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              <option value={ENDPOINT_IDS.SEPOLIA}>Sepolia Testnet</option>
              <option value={ENDPOINT_IDS.MUMBAI}>Mumbai Testnet</option>
              <option value={ENDPOINT_IDS.ETHEREUM}>Ethereum Mainnet</option>
              <option value={ENDPOINT_IDS.POLYGON}>Polygon</option>
              <option value={ENDPOINT_IDS.ARBITRUM}>Arbitrum</option>
              <option value={ENDPOINT_IDS.OPTIMISM}>Optimism</option>
              <option value={ENDPOINT_IDS.BASE}>Base</option>
            </select>
          </div>

          {/* Destination Chain */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination Chain</label>
            <select
              value={formData.dstEid}
              onChange={(e) => handleInputChange("dstEid", parseInt(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              <option value={ENDPOINT_IDS.SEPOLIA}>Sepolia Testnet</option>
              <option value={ENDPOINT_IDS.MUMBAI}>Mumbai Testnet</option>
              <option value={ENDPOINT_IDS.ETHEREUM}>Ethereum Mainnet</option>
              <option value={ENDPOINT_IDS.POLYGON}>Polygon</option>
              <option value={ENDPOINT_IDS.ARBITRUM}>Arbitrum</option>
              <option value={ENDPOINT_IDS.OPTIMISM}>Optimism</option>
              <option value={ENDPOINT_IDS.BASE}>Base</option>
            </select>
          </div>

          {/* OFT Contract Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">OFT Contract Address *</label>
            <input
              type="text"
              value={formData.oftAddress}
              onChange={(e) => handleInputChange("oftAddress", e.target.value)}
              placeholder="0x..."
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount *</label>
            <input
              type="number"
              step="any"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="100"
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Address *</label>
            <input
              type="text"
              value={formData.to}
              onChange={(e) => handleInputChange("to", e.target.value)}
              placeholder="0x..."
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          {/* Min Amount (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Minimum Amount (Optional)</label>
            <input
              type="number"
              step="any"
              value={formData.minAmount}
              onChange={(e) => handleInputChange("minAmount", e.target.value)}
              placeholder="Same as amount if not specified"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Sending..." : `Send from ${getNetworkName(formData.srcEid)} to ${getNetworkName(formData.dstEid)}`}
          </Button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">❌ Error: {error}</p>
          </div>
        )}

        {/* Success Display */}
        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
            <p className="text-green-800 font-medium">✅ Transfer completed successfully!</p>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Transaction Hash:</strong>{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                  {result.txHash}
                </code>
              </p>
              <p>
                <strong>LayerZero Scan:</strong>{" "}
                <a
                  href={result.scanLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Transaction
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Make sure your wallet is connected and on the source chain</li>
            <li>2. Enter the OFT contract address for the token you want to send</li>
            <li>3. Specify the amount and recipient address</li>
            <li>4. The transaction will handle approvals automatically if needed</li>
            <li>5. You&apos;ll need native tokens to pay for gas and LayerZero fees</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 