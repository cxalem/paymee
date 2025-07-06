import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

type CreatePaymeeProps = {
  children?: React.ReactNode;
};

export type PayMeeData = {
  id: string;
  amount: string;
  concept: string;
  clientName: string;
  recipientAddress: string; // Freelancer's wallet address
  createdAt: string;
  status: "pending" | "paid" | "expired";
};

export function CreatePaymee({ children }: CreatePaymeeProps) {
  const { user } = usePrivy();
  
  //create the state for the amount, concept, and client name
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [clientName, setClientName] = useState("");

  // Generate UUID (using crypto.randomUUID() or fallback)
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  //logic for button click to generate payment link and save to localStorage
  const handleGenerateLink = () => {
    if (!amount || !concept || !clientName) {
      alert("Please fill in all fields");
      return;
    }

    // Check if user is authenticated and has a wallet
    if (!user?.wallet?.address) {
      alert("Please make sure you're logged in and have a wallet connected");
      return;
    }

    // Create PayMee data
    const newPayMee: PayMeeData = {
      id: generateUUID(),
      amount,
      concept,
      clientName,
      recipientAddress: user.wallet.address, // Freelancer's wallet address
      createdAt: new Date().toISOString(),
      status: "pending"
    };

    const paymentLink = `${window.location.origin}/pay/${newPayMee.id}`;
    
    console.log("Payment link generated:", paymentLink);

    // Get existing PayMees from localStorage
    const existingPayMees = JSON.parse(localStorage.getItem('paymees') || '[]') as PayMeeData[];
    
    // Add new PayMee
    const updatedPayMees = [...existingPayMees, newPayMee];
    
    // Save to localStorage
    localStorage.setItem('paymees', JSON.stringify(updatedPayMees));
    console.log("PayMee saved:", newPayMee);
    
    // Clear form
    setAmount("");
    setConcept("");
    setClientName("");
    
    // Trigger a custom event to notify the dashboard to refresh
    window.dispatchEvent(new Event('paymeeCreated'));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white transition-all duration-150 shadow-lg">
          {children ? (
            children
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Paymee
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Payment link</DialogTitle>
          <DialogDescription>
            Generate a custom payment link for your clients. Set an amount and
            preferred token or let the client choose.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount in ETH"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="amount">Concept</Label>
            <Input
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Services of March"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="amount">Client Name</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" onClick={handleGenerateLink}>
              Generate Link
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
