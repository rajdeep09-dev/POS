"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndianRupee, CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (tenders: { cash: number; upi: number; card: number }) => void;
}

export function SplitPaymentModal({ isOpen, onClose, totalAmount, onConfirm }: SplitPaymentModalProps) {
  const [cash, setCash] = useState<string>("");
  const [upi, setUpi] = useState<string>("");
  const [card, setCard] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setCash(totalAmount.toString());
      setUpi("");
      setCard("");
    }
  }, [isOpen, totalAmount]);

  const numCash = Number(cash) || 0;
  const numUpi = Number(upi) || 0;
  const numCard = Number(card) || 0;

  const currentTotal = numCash + numUpi + numCard;
  const remaining = totalAmount - currentTotal;

  const handleConfirm = () => {
    if (currentTotal < totalAmount) return; // Prevent under-payment
    onConfirm({ cash: numCash, upi: numUpi, card: numCard });
    onClose();
  };

  const autoFill = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (remaining > 0) {
      setter(prev => (Number(prev) + remaining).toString());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase italic">Split Payment</DialogTitle>
          <DialogDescription>Divide the total amount across multiple tender types.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex justify-between items-center border border-zinc-100 dark:border-zinc-700 shadow-inner">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Bill Total</span>
            <span className="text-2xl font-black tabular-nums">₹{totalAmount.toLocaleString()}</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Cash</span>
                <button type="button" onClick={() => autoFill(setCash)} className="text-[10px] text-primary hover:underline">Auto-fill</button>
              </Label>
              <Input type="number" value={cash} onChange={e => setCash(e.target.value)} className="h-12 text-lg font-black" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2"><QrCode className="h-4 w-4" /> UPI</span>
                <button type="button" onClick={() => autoFill(setUpi)} className="text-[10px] text-primary hover:underline">Auto-fill</button>
              </Label>
              <Input type="number" value={upi} onChange={e => setUpi(e.target.value)} className="h-12 text-lg font-black" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Card</span>
                <button type="button" onClick={() => autoFill(setCard)} className="text-[10px] text-primary hover:underline">Auto-fill</button>
              </Label>
              <Input type="number" value={card} onChange={e => setCard(e.target.value)} className="h-12 text-lg font-black" placeholder="0" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Remaining</span>
            <span className={cn("text-xl font-black tabular-nums", remaining > 0 ? "text-red-500" : remaining < 0 ? "text-amber-500" : "text-emerald-500")}>
              ₹{remaining.toLocaleString()}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={currentTotal < totalAmount} className="w-full h-12 font-black uppercase tracking-widest rounded-xl bg-primary">
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
