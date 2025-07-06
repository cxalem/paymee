"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendOFTServerAction, SendOFTParams } from "@/app/actions/send-oft";

// Common endpoint IDs
const ENDPOINT_IDS = {
  ETHEREUM: 30101,
  POLYGON: 30109,
  ARBITRUM: 30110,
  OPTIMISM: 30111,
  BASE: 30184,
  SEPOLIA: 40161,
  MUMBAI: 40109,
} as const;

// Helper function to get network name
function getNetworkName(eid: number): string {
  const networks: Record<number, string> = {
    30101: "Ethereum",
    30109: "Polygon",
    30110: "Arbitrum",
    30111: "Optimism",
    30184: "Base",
    40161: "Sepolia",
    40109: "Mumbai",
  };
  return networks[eid] || `Chain ${eid}`;
}

export function SendOFTServerComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ txHash: string; scanLink?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    srcEid: ENDPOINT_IDS.SEPOLIA,
    dstEid: ENDPOINT_IDS.MUMBAI,
    amount: "",
    to: "",
    oftAddress: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!formData.amount || !formData.to) {
        throw new Error("Please fill in amount and recipient address");
      }

      const params: SendOFTParams = {
        srcEid: formData.srcEid,
        dstEid: formData.dstEid,
        amount: formData.amount,
        to: formData.to,
        oftAddress: formData.oftAddress || undefined,
      };

      console.log("🚀 Sending OFT transfer request to server...");
      const result = await sendOFTServerAction(params);

      if (result.success) {
        setResult({
          txHash: result.txHash!,
          scanLink: result.scanLink,
        });
      } else {
        setError(result.error || "Unknown error occurred");
      }
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
        <CardTitle>Send OFT Tokens (Server-Side)</CardTitle>
        <CardDescription>
          Transfer tokens between blockchains using LayerZero OFT - runs on the server with your private keys
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
            <label className="text-sm font-medium">OFT Contract Address (Optional)</label>
            <input
              type="text"
              value={formData.oftAddress}
              onChange={(e) => handleInputChange("oftAddress", e.target.value)}
              placeholder="0x... (leave empty to auto-detect from config)"
              className="w-full p-2 border rounded-md"
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

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Processing on server..." : `Send from ${getNetworkName(formData.srcEid)} to ${getNetworkName(formData.dstEid)}`}
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
              {result.scanLink && (
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
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">Server-Side Transfer:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Runs on your server using your configured private keys</li>
            <li>• No wallet connection required from the user</li>
            <li>• Uses your LayerZero configuration and deployments</li>
            <li>• Automatically handles approvals and gas estimation</li>
            <li>• Requires proper environment variables to be set</li>
          </ul>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              ⏳ Processing transaction on server... This may take a few minutes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 