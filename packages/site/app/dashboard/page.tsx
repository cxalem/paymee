"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Login } from "@/components/login";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Copy,
  QrCode,
  Wallet,
  UserPlus,
  Package,
  PenTool,
  LayoutDashboard,
  RefreshCw,
} from "lucide-react";
import { getWETHBalance, getETHBalance } from "@/lib/metamask-utils";
import SendETHServerComponent from "@/components/send-eth-server-component";

// Sample data
const invoiceData = [
  {
    title: "Logo Design",
    issuedTo: "Alejandro Mena",
    status: "pending" as const,
    icon: "PenTool" as const,
  },
  {
    title: "Web Design",
    issuedTo: "John Doe",
    status: "paid" as const,
    icon: "LayoutDashboard" as const,
  },
  {
    title: "Product Development",
    issuedTo: "invoices@decentralstudio.xyz",
    status: "expired" as const,
    icon: "Package" as const,
  },
  {
    title: "Web Design",
    issuedTo: "John Doe",
    status: "paid" as const,
    icon: "LayoutDashboard" as const,
  },
];

// Icon mapping for type safety
const iconMap = {
  PenTool,
  LayoutDashboard,
  Package,
} as const;

type IconName = keyof typeof iconMap;

// AccountSummary Component
interface AccountSummaryProps {
  user: any; // Privy user object
}

function AccountSummary({ user }: AccountSummaryProps) {
  const [balances, setBalances] = useState<{
    eth: string;
    weth: string;
  }>({
    eth: "0.00",
    weth: "0.00",
  });
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch balances
  const fetchBalances = async () => {
    if (!user.wallet?.address) return;

    setBalanceLoading(true);
    setBalanceError(null);

    try {
      const [ethBalance, wethBalance] = await Promise.all([
        getETHBalance(user.wallet.address as `0x${string}`, "sepolia"),
        getWETHBalance(user.wallet.address as `0x${string}`, "sepolia"),
      ]);

      setBalances({
        eth: ethBalance.formatted,
        weth: wethBalance.formatted,
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
      setBalanceError("Failed to fetch balances");
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch balances on component mount and when user changes
  useEffect(() => {
    if (user.wallet?.address) {
      fetchBalances();
    }
  }, [user.wallet?.address]);
  // Extract user information
  const getUserName = () => {
    if (user.email?.address) {
      return user.email.address.split("@")[0];
    }
    if (user.phone?.number) {
      return user.phone.number;
    }
    if (user.google?.name) {
      return user.google.name;
    }
    if (user.discord?.username) {
      return user.discord.username;
    }
    return "User";
  };

  const getUserInitials = () => {
    const name = getUserName();
    const nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getWalletAddress = () => {
    if (user.wallet?.address) {
      const addr = user.wallet.address;
      return `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
    }
    return "No wallet connected";
  };

  const copyWalletAddress = async () => {
    if (user.wallet?.address) {
      try {
        await navigator.clipboard.writeText(user.wallet.address);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  const getUserAvatar = () => {
    if (user.google?.profilePictureUrl) {
      return user.google.profilePictureUrl;
    }
    return null;
  };

  return (
    <div className="rounded-xl flex gap-4 items-center justify-between shadow-lg transition-all duration-150">
      {/* Left block */}
      <div className="flex items-center gap-4 bg-[#1F1D23] w-full p-4 rounded-xl">
        <Avatar className="w-14 h-14 rounded-xl">
          <AvatarImage
            src={getUserAvatar() || "/placeholder.svg?height=56&width=56"}
          />
          <AvatarFallback className="rounded-xl bg-gray-600 text-white font-semibold">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <h3 className="text-white font-semibold">{getUserName()}</h3>
          <p className="font-mono text-muted-foreground/60 text-sm">
            {getWalletAddress()}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8 text-muted-foreground hover:text-white hover:bg-gray-700 transition-all duration-150"
            onClick={copyWalletAddress}
            title={copySuccess ? "Copied!" : "Copy wallet address"}
          >
            <Copy
              className={`w-4 h-4 ${copySuccess ? "text-green-400" : ""}`}
            />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8 text-muted-foreground hover:text-white hover:bg-gray-700 transition-all duration-150"
            title="Show QR code"
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right */}
      <div className="bg-[#1F1D23] h-full p-4 rounded-xl w-full flex justify-between items-center gap-6">
        <div className="w-12 h-12 bg-gray-600/30 rounded-xl flex items-center justify-center">
          <Wallet className="w-6 h-6 text-gray-400" />
        </div>
        <div className="flex items-center gap-4">
          {!user.wallet?.address ? (
            <div className="text-2xl font-semibold text-muted-foreground">
              No wallet connected
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <div className="text-2xl font-semibold text-white flex items-center gap-2">
                {balanceLoading ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : (
                  `${parseFloat(balances.weth).toFixed(4)} WETH`
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {balanceLoading
                  ? "Loading..."
                  : `${parseFloat(balances.eth).toFixed(4)} ETH`}
              </div>
              {balanceError && (
                <div className="text-xs text-red-400 mt-1">{balanceError}</div>
              )}
            </div>
          )}
          <Button
            onClick={fetchBalances}
            disabled={balanceLoading}
            size="icon"
            variant="ghost"
            className="w-8 h-8 text-muted-foreground hover:text-white hover:bg-gray-700 transition-all duration-150"
            title="Refresh balances"
          >
            <RefreshCw
              className={`w-4 h-4 ${balanceLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>
      <Button className="bg-violet-600 hover:bg-violet-700 text-white transition-all duration-150 shadow-lg">
        <UserPlus className="w-4 h-4 mr-2" />
        Create Paymee
      </Button>
    </div>
  );
}

// InvoiceRow Component
interface InvoiceRowProps {
  title: string;
  issuedTo: string;
  status: "pending" | "paid" | "expired";
  icon: IconName;
}

function InvoiceRow({ title, issuedTo, status, icon }: InvoiceRowProps) {
  // Get the icon component dynamically with type safety
  const IconComponent = iconMap[icon] || Package;

  // Status color mapping
  const statusColors = {
    pending: "text-yellow-400",
    paid: "text-green-500",
    expired: "text-red-500",
  } as const;

  return (
    <div className="bg-[#26242B] hover:bg-[#32303A] rounded-xl px-6 py-4 flex items-center justify-between w-full transition-all duration-150 shadow-lg cursor-pointer">
      {/* Left - Icon */}
      <div className="w-12 h-12 bg-gray-600/30 rounded-xl flex items-center justify-center">
        <IconComponent className="w-6 h-6 text-gray-400" />
      </div>

      {/* Middle - Title and Issued To */}
      <div className="flex-1 ml-4">
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-muted-foreground">Issued to: {issuedTo}</p>
      </div>

      {/* Right - Status */}
      <div className={`flex items-center gap-2 ${statusColors[status]}`}>
        <span className="capitalize font-medium">{status}</span>
        <span className="w-2.5 h-2.5 rounded-full bg-current" />
      </div>
    </div>
  );
}

// DashboardPage Component
interface DashboardPageProps {
  user: any; // Privy user object
}

function DashboardPage({ user }: DashboardPageProps) {
  // For now, show a message if no PayMees exist
  const hasPayMees = invoiceData.length > 0;

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-4">
      <AccountSummary user={user} />

      {hasPayMees ? (
        <>
          {invoiceData.map((invoice, index) => (
            <InvoiceRow
              key={index}
              title={invoice.title}
              issuedTo={invoice.issuedTo}
              status={invoice.status}
              icon={invoice.icon}
            />
          ))}
        </>
      ) : (
        <div className="bg-[#1F1D23] rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-600/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">
            No PayMees yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first PayMee to start accepting payments
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            Create Your First PayMee
          </Button>
        </div>
      )}
    </div>
  );
}

// Main Component
export default function FreelanceDashboard() {
  const { user, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      console.log("User not authenticated, redirecting to login");
      router.push("/login");
    }
  }, [user, ready, router]);

  // Show loading while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Login />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#130F16] text-slate-100">
      <DashboardPage user={user} />
    </div>
  );
}
