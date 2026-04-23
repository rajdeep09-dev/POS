"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShift } from "@/components/providers/ShiftProvider";
import { useTenant } from "@/components/providers/TenantProvider";
import { db, Expense } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
import { IndianRupee, Receipt, Plus, Coffee, Truck, Lightbulb, MoreHorizontal, Trash2 } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = [
  { id: 'Food & Tea', icon: Coffee },
  { id: 'Logistics', icon: Truck },
  { id: 'Utilities', icon: Lightbulb },
  { id: 'Maintenance', icon: MoreHorizontal },
  { id: 'Other', icon: IndianRupee }
];

export default function ExpensesPage() {
  const { tenant } = useTenant();
  const { activeShift } = useShift();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Tea");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const expenses = useLiveQuery(() => 
    db.expenses.orderBy('date').reverse().limit(20).toArray()
  , []);

  const handleAddExpense = async () => {
    if (!tenant?.id || !amount) return;
    setIsProcessing(true);
    
    try {
      const newExpense: Expense = {
        id: uuidv4(),
        tenant_id: tenant.id,
        shift_id: activeShift?.id,
        category,
        amount: Number(amount),
        payment_method: 'cash',
        notes,
        date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: 0,
        sync_status: 'pending',
        version_clock: Date.now()
      };

      await db.expenses.add(newExpense);
      toast.success("Expense Logged", { description: `₹${amount} recorded for ${category}` });
      setAmount("");
      setNotes("");
    } catch (err) {
      toast.error("Failed to save expense");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Shop Expenses</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Petty Cash & Daily Expenditure</p>
        </div>
        {!activeShift && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-amber-700">
            <Receipt className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-tight">Warning: No Active Shift. Expenses will not be shift-linked.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {/* ADD EXPENSE FORM */}
        <Card className="md:col-span-5 border-zinc-200 shadow-xl rounded-3xl h-fit sticky top-28">
          <CardHeader>
            <CardTitle className="text-lg">Log New Expense</CardTitle>
            <CardDescription>Enter details for the cash payout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as string)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <c.icon className="h-4 w-4" />
                        <span>{c.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="pl-10 h-12 text-lg font-black rounded-xl"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description / Notes</Label>
              <Input 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="E.g., Tea for staff, Diesel for delivery" 
                className="h-12 rounded-xl"
              />
            </div>

            <Button 
              onClick={handleAddExpense} 
              disabled={isProcessing || !amount}
              className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20"
            >
              {isProcessing ? 'Saving...' : 'Record Expense'}
            </Button>
          </CardContent>
        </Card>

        {/* RECENT EXPENSES LIST */}
        <div className="md:col-span-7 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-2">Recent Transactions</h3>
          <div className="space-y-3">
            {expenses?.map(exp => (
              <Card key={exp.id} className="border-zinc-100 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500">
                      {CATEGORIES.find(c => c.id === exp.category)?.icon ? 
                        (() => {
                          const Icon = CATEGORIES.find(c => c.id === exp.category)!.icon;
                          return <Icon className="h-6 w-6" />;
                        })() : <IndianRupee className="h-6 w-6" />
                      }
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase italic">{exp.category}</h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                        {format(new Date(exp.date), 'MMM dd, p')} {exp.shift_id ? '• Shift Linked' : ''}
                      </p>
                      {exp.notes && <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-1">{exp.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black tabular-nums text-red-500">-₹{exp.amount.toLocaleString()}</div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {expenses?.length === 0 && (
              <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase">No expenses recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
