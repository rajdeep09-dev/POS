"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShift } from "@/components/providers/ShiftProvider";
import { Lock, Unlock, Loader2, IndianRupee, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function ShiftsPage() {
  const { activeShift, openShift, closeShift, isLoading } = useShift();
  const [cashInput, setCashInput] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // If a shift is active, calculate expected cash based on sales
  const shiftSales = useLiveQuery(async () => {
    if (!activeShift) return [];
    return await db.sales
      .where('shift_id').equals(activeShift.id)
      .and(s => s.status !== 'void')
      .toArray();
  }, [activeShift?.id]);

  const totalCashSales = shiftSales?.reduce((acc, sale) => acc + (sale.cash_amount || sale.total_amount), 0) || 0;
  const expectedCash = (activeShift?.starting_cash || 0) + totalCashSales;

  const handleOpen = async () => {
    setIsProcessing(true);
    await openShift(Number(cashInput), notes);
    setIsProcessing(false);
    setCashInput("");
    setNotes("");
    router.push('/pos');
  };

  const handleClose = async () => {
    if (!confirm("Are you sure you want to close this shift? A Z-Report will be generated.")) return;
    setIsProcessing(true);
    await closeShift(Number(cashInput), expectedCash, notes);
    setIsProcessing(false);
    setCashInput("");
    setNotes("");
  };

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl">
          {activeShift ? <Unlock className="h-6 w-6 text-primary" /> : <Lock className="h-6 w-6 text-zinc-500" />}
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight">Shift Register</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            {activeShift ? `Opened ${format(new Date(activeShift.opened_at), 'p')}` : 'Terminal Locked'}
          </p>
        </div>
      </div>

      <Card className="border-zinc-200 shadow-xl rounded-3xl overflow-hidden">
        {activeShift ? (
          // CLOSE SHIFT UI
          <>
            <CardHeader className="bg-primary/5 border-b border-zinc-100">
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" /> Active Shift Z-Report
              </CardTitle>
              <CardDescription>Verify your drawer totals before closing.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Starting Float</p>
                  <p className="text-2xl font-black tabular-nums">₹{activeShift.starting_cash.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Expected Cash</p>
                  <p className="text-2xl font-black tabular-nums">₹{expectedCash.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Actual Cash in Drawer</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                    <Input 
                      type="number" 
                      value={cashInput} 
                      onChange={e => setCashInput(e.target.value)} 
                      className="pl-10 h-12 text-lg font-black"
                      placeholder={expectedCash.toString()}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Discrepancy Notes (Optional)</Label>
                  <Input 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="E.g., Short by ₹10 due to change issue" 
                  />
                </div>
              </div>

              <Button 
                onClick={handleClose} 
                disabled={isProcessing || !cashInput} 
                className="w-full h-14 bg-zinc-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest shadow-xl"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Close Register & Generate Z-Report'}
              </Button>
            </CardContent>
          </>
        ) : (
          // OPEN SHIFT UI
          <>
            <CardHeader>
              <CardTitle>Open Register</CardTitle>
              <CardDescription>Enter your starting float (petty cash) to begin billing.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Starting Cash (Float)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                  <Input 
                    type="number" 
                    value={cashInput} 
                    onChange={e => setCashInput(e.target.value)} 
                    className="pl-10 h-12 text-lg font-black"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <Button 
                onClick={handleOpen} 
                disabled={isProcessing || !cashInput} 
                className="w-full h-14 bg-primary text-primary-foreground hover:opacity-90 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Open Shift'}
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
