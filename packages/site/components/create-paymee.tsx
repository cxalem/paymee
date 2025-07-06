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
import { useState } from "react";

export function CreatePaymee() {
  //create the state for the amount, concept, and client name
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [clientName, setClientName] = useState("");

  //logic for button click to generate payment link
  const handleGenerateLink = () => {
    const paymentLink = `https://paymee.io/pay?amount=${encodeURIComponent(
      amount
    )}&concept=${encodeURIComponent(concept)}&client=${encodeURIComponent(
      clientName
    )}`;
    console.log("Payment link generated:", paymentLink);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create Paymee</Button>
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
