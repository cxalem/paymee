import { ReactNode } from "react";

export default function PaymentLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Clean layout for payment pages - no sidebar, no dashboard components
  return (
    <div className="min-h-screen bg-[#130F16]">
      {children}
    </div>
  );
} 