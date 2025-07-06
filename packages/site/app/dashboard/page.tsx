"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
} from "lucide-react";


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
function AccountSummary() {
  return (
    <div className="bg-[#1F1D23] rounded-xl p-6 flex items-center justify-between shadow-lg transition-all duration-150">
      {/* Left block */}
      <div className="flex items-center gap-4">
        <Avatar className="w-14 h-14 rounded-xl">
          <AvatarImage src="/placeholder.svg?height=56&width=56" />
          <AvatarFallback className="rounded-xl bg-gray-600 text-white font-semibold">
            JD
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <h3 className="text-white font-semibold">John Doe</h3>
          <p className="font-mono text-muted-foreground/60 text-sm">
            3CKuvh…AAWc
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8 text-muted-foreground hover:text-white hover:bg-gray-700 transition-all duration-150"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8 text-muted-foreground hover:text-white hover:bg-gray-700 transition-all duration-150"
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Center */}
      <div className="w-12 h-12 bg-gray-600/30 rounded-xl flex items-center justify-center">
        <Wallet className="w-6 h-6 text-gray-400" />
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">
        <div className="text-4xl font-semibold text-white">$15,597.84</div>

        <Button className="bg-violet-600 hover:bg-violet-700 text-white transition-all duration-150 shadow-lg">
          <UserPlus className="w-4 h-4 mr-2" />
          Create Paymee
        </Button>
      </div>
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
function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-4">
      <AccountSummary />

      {invoiceData.map((invoice, index) => (
        <InvoiceRow
          key={index}
          title={invoice.title}
          issuedTo={invoice.issuedTo}
          status={invoice.status}
          icon={invoice.icon}
        />
      ))}
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
      <DashboardPage />
    </div>
  );
}
