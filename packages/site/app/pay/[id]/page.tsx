"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivy, useLoginWithOAuth } from "@privy-io/react-auth";
import { PayMeeData } from "@/components/create-paymee";
import { sendETHServerAction, SendETHParams, SendETHResult } from "@/app/actions/send-eth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown, Wallet, ExternalLink } from "lucide-react";
import GoogleLogo from "@/components/icons/google-logo";

export default function PayMeePage() {
  const params = useParams();
  const router = useRouter();
  const { user, ready } = usePrivy();
  const { loading: loginLoading, initOAuth } = useLoginWithOAuth();
  const [payMeeData, setPayMeeData] = useState<PayMeeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendETHResult | null>(null);
  
  // Payment params for the cross-chain transaction
  const [paymentParams, setPaymentParams] = useState<SendETHParams>({
    srcEid: 40161, // Ethereum Sepolia
    dstEid: 40232, // Optimism Sepolia
    amount: "0",
    to: "",
  });

  // Load PayMee data from localStorage
  useEffect(() => {
    const loadPayMeeData = () => {
      try {
        const savedPaymees = localStorage.getItem('paymees');
        if (savedPaymees) {
          const parsedPaymees = JSON.parse(savedPaymees) as PayMeeData[];
          const foundPayMee = parsedPaymees.find(p => p.id === params.id);
          if (foundPayMee) {
            setPayMeeData(foundPayMee);
            setPaymentParams(prev => ({ ...prev, amount: foundPayMee.amount, to: foundPayMee.recipientAddress }));
          }
        }
      } catch (error) {
        console.error('Error loading PayMee data:', error);
      }
    };

    if (params.id) {
      loadPayMeeData();
    }
  }, [params.id]);

  // No need to auto-populate recipient address as it comes from the PayMee data

  const handlePayNowSecurely = async () => {
    // If user is not authenticated, prompt for login
    if (!user) {
      await handleGoogleLogin();
      return;
    }

    if (!payMeeData || !payMeeData.recipientAddress) {
      alert("PayMee data is invalid or missing recipient address");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await sendETHServerAction({
        ...paymentParams,
        to: payMeeData.recipientAddress,
      });
      setResult(response);
      
      // If successful, update the PayMee status in localStorage and local state
      if (response.success) {
        const savedPaymees = JSON.parse(localStorage.getItem('paymees') || '[]') as PayMeeData[];
        const updatedPaymees = savedPaymees.map(p => 
          p.id === params.id ? { ...p, status: 'paid' as const } : p
        );
        localStorage.setItem('paymees', JSON.stringify(updatedPaymees));
        
        // Update local state to immediately reflect the change
        setPayMeeData(prev => prev ? { ...prev, status: 'paid' as const } : prev);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await initOAuth({ provider: "google" });
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Please try again.");
    }
  };

  const handleConnectWallet = async () => {
    if (!user) {
      await handleGoogleLogin();
    } else {
      // If user is logged in but doesn't have a wallet, could trigger wallet creation
      alert("Wallet functionality coming soon!");
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#130F16] text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!payMeeData) {
    return (
      <div className="min-h-screen bg-[#130F16] text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading PayMee...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#130F16] text-slate-100">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 mb-4 p-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-sm text-gray-400 mb-2">Create payment link (creator)</h1>
        </div>

        {/* Payment Form */}
        <div className="bg-[#1F1D23] rounded-2xl p-6 space-y-6">
          {/* Payment Status Banner - Show if already paid */}
          {payMeeData.status === 'paid' && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 text-center">
              <div className="text-green-400 font-semibold mb-1">
                ✅ Payment Completed
              </div>
              <div className="text-sm text-gray-300">
                This PayMee has already been paid successfully.
              </div>
            </div>
          )}

          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {payMeeData.concept}
            </h2>
            <p className="text-gray-400">
              {payMeeData.status === 'paid' 
                ? 'This payment has been completed.' 
                : 'Pay securely using your preferred wallet and blockchain.'
              }
            </p>
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.001"
                value={paymentParams.amount}
                onChange={(e) => setPaymentParams(prev => ({ ...prev, amount: e.target.value }))}
                disabled={payMeeData.status === 'paid'}
                className={`border-gray-600 text-white pr-24 text-lg font-mono ${
                  payMeeData.status === 'paid' 
                    ? 'bg-gray-700 cursor-not-allowed' 
                    : 'bg-[#2A2832]'
                }`}
                placeholder="000"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                  Ξ
                </div>
                <span className="text-white font-medium">ETH</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Concept Field */}
          <div className="space-y-2">
            <Label htmlFor="concept" className="text-white">Concept</Label>
            <Input
              id="concept"
              value={payMeeData.concept}
              readOnly
              className="bg-[#2A2832] border-gray-600 text-white"
            />
          </div>

          {/* Recipient Address Display - Show the freelancer's address */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-white">Recipient Address</Label>
            <Input
              id="recipient"
              value={payMeeData.recipientAddress}
              readOnly
              className="bg-[#2A2832] border-gray-600 text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-400">
              Payment will be sent to the freelancer's address
            </p>
          </div>

          {/* Pay Now Button */}
          <Button
            onClick={handlePayNowSecurely}
            disabled={loading || loginLoading || payMeeData.status === 'paid'}
            className={`w-full font-semibold py-4 rounded-xl text-lg transition-all duration-200 ${
              payMeeData.status === 'paid'
                ? 'bg-gray-600 hover:bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white'
            }`}
          >
            {payMeeData.status === 'paid' ? (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Payment Completed
              </>
            ) : loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </>
            ) : loginLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Logging in...
              </>
            ) : !user ? (
              <>
                <GoogleLogo className="w-4 h-4 mr-2" />
                Sign in with Google to pay
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Pay now securely
              </>
            )}
          </Button>

          {/* Connect Wallet Button - Only show if user is not authenticated */}
          {!user && (
            <Button
              onClick={handleConnectWallet}
              variant="outline"
              className="w-full bg-transparent border-gray-600 text-white hover:bg-gray-800 font-semibold py-4 rounded-xl text-lg transition-all duration-200"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect your wallet to pay
            </Button>
          )}

          {/* User Status - Show if authenticated */}
          {user && (
            <div className="text-center p-3 bg-green-900/20 border border-green-500/30 rounded-xl">
              <div className="text-green-400 text-sm">
                ✅ Signed in as {user.email?.address || user.google?.name || 'User'}
              </div>
              {user.wallet?.address && (
                <div className="text-xs text-gray-400 mt-1">
                  Wallet: {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-gray-400 text-sm">
            Secure Payment • Web3 Powered
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`mt-6 p-4 rounded-xl ${
            result.success 
              ? "bg-green-900/20 border border-green-500/30 text-green-400" 
              : "bg-red-900/20 border border-red-500/30 text-red-400"
          }`}>
            {result.success ? (
              <div>
                <div className="font-semibold mb-2">✅ Payment Successful!</div>
                <div className="text-sm space-y-1 text-gray-300">
                  <div><strong>Transaction Hash:</strong> {result.txHash}</div>
                  {result.scanUrl && (
                    <div>
                      <a 
                        href={result.scanUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        View on Explorer →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="font-semibold mb-2">❌ Payment Failed</div>
                <div className="text-sm text-gray-300">{result.error}</div>
              </div>
            )}
          </div>
        )}

        {/* Payment Info */}
        <div className="mt-8 p-4 bg-[#1F1D23] rounded-xl">
          <div className="text-sm text-gray-400 space-y-2">
            <div className="font-semibold text-gray-300 mb-3">Payment Details:</div>
            <div><strong>Client:</strong> {payMeeData.clientName}</div>
            <div><strong>Amount:</strong> {payMeeData.amount} ETH</div>
            <div><strong>Created:</strong> {new Date(payMeeData.createdAt).toLocaleDateString()}</div>
            <div><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                payMeeData.status === 'paid' ? 'bg-green-900/20 text-green-400' :
                payMeeData.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' :
                'bg-red-900/20 text-red-400'
              }`}>
                {payMeeData.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 