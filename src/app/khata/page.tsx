"use client";

import { useState } from "react";
import { Users, MessageSquare, IndianRupee, Search, Plus, Filter, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function Khata() {
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBalance, setNewBalance] = useState("");

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];

  const totalCredit = customers.reduce((acc, curr) => acc + curr.balance, 0);

  const handleAddCustomer = async () => {
    if (!newName || !newPhone) {
      toast.error("Name and Phone are required");
      return;
    }
    const balance = newBalance ? parseInt(newBalance) : 0;
    
    try {
      await db.customers.add({
        id: uuidv4(),
        name: newName,
        phone: newPhone,
        balance,
        last_tx: "Just added",
        status: balance > 0 ? "Overdue" : "Clear"
      });
      toast.success("Customer Added!");
      setNewName(""); setNewPhone(""); setNewBalance("");
    } catch(e) {
      toast.error("Failed to add customer");
    }
  };

  const handleSendReminder = (phone: string, balance: number, name: string) => {
    const text = encodeURIComponent(`Hello ${name}, this is a gentle reminder from Joy Ram Steel. Your pending Khata balance is ₹${balance}. Please settle it at your earliest convenience.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
    toast.success("Opened WhatsApp with reminder message");
  };

  const handleSettle = async (id: string, currentBalance: number) => {
    const amountStr = prompt(`Current Balance: ₹${currentBalance}\nEnter amount to settle:`);
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    
    const newBalance = Math.max(0, currentBalance - amount);
    await db.customers.update(id, { 
      balance: newBalance,
      status: newBalance === 0 ? "Clear" : "Overdue",
      last_tx: "Just now"
    });
    toast.success(`Settled ₹${amount}. New balance: ₹${newBalance}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Digital Khata (Ledger)</h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage customer credit, view history, and send WhatsApp reminders.</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30 rounded-xl h-12 px-6"><Plus className="mr-2 h-5 w-5" /> Add Customer</Button>} />
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Customer</DialogTitle>
              <DialogDescription>Add a new customer to your ledger for Udhar tracking.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold">Customer Name</Label>
                <Input id="name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Ramesh Steel Traders" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-bold">WhatsApp/Phone</Label>
                <Input id="phone" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="e.g. 9876543210" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance" className="font-bold">Initial Pending Balance (₹)</Label>
                <Input id="balance" type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} placeholder="0" className="h-12 rounded-xl text-red-600 font-bold" />
              </div>
            </div>
            <Button onClick={handleAddCustomer} className="w-full h-14 text-lg rounded-xl shadow-lg bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Save Customer
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white md:col-span-1 rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <CardContent className="p-6 relative z-10">
            <h3 className="font-semibold text-amber-100 flex items-center gap-2 mb-2 text-lg">
              <IndianRupee className="h-5 w-5" /> Total Market Credit
            </h3>
            <div className="text-5xl font-black tracking-tight">₹{totalCredit.toLocaleString()}</div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-medium text-amber-100 bg-amber-900/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                Across {customers.length} active customers
              </p>
              <ArrowUpRight className="h-6 w-6 text-amber-200 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search customers by name or phone..." 
            className="pl-12 h-14 text-lg bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-14 px-6 rounded-xl bg-white border-slate-200 text-slate-700 shadow-sm font-bold">
          <Filter className="mr-2 h-5 w-5" /> Filter
        </Button>
      </div>

      <div className="grid gap-4">
        {customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)).map((customer) => (
          <Card key={customer.id} className="border-none shadow-md bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all rounded-2xl group">
            <CardContent className="p-5 flex flex-col md:flex-row gap-6 justify-between md:items-center">
              
              <div className="flex items-center gap-5">
                <Avatar className="h-16 w-16 rounded-2xl bg-amber-100 text-amber-700 shadow-sm border border-amber-200">
                  <AvatarFallback className="text-2xl font-black rounded-2xl bg-amber-100">{customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900 group-hover:text-blue-700 transition-colors">{customer.name}</h3>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">{customer.phone}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>Last TX: {customer.last_tx}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-6 md:w-auto w-full pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Balance</div>
                  <div className="text-2xl font-black text-red-600">₹{customer.balance.toLocaleString()}</div>
                  {customer.status === "Overdue" && customer.balance > 0 && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded mt-1 inline-block">7+ Days Overdue</span>
                  )}
                  {customer.balance === 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">Settled</span>
                  )}
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="outline" className="flex-1 sm:flex-none h-12 px-6 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50" onClick={() => handleSettle(customer.id, customer.balance)} disabled={customer.balance === 0}>
                    Settle Partial
                  </Button>
                  <Button 
                    className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/30 font-bold"
                    onClick={() => handleSendReminder(customer.phone, customer.balance, customer.name)}
                    disabled={customer.balance === 0}
                  >
                    <MessageSquare className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Send WhatsApp</span>
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
