"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Supplier } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useTenant } from "@/components/providers/TenantProvider";
import { Users, Phone, FileText, Plus, Search, Building2, TrendingDown } from "lucide-react";

export default function SuppliersPage() {
  const { tenant } = useTenant();
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const suppliers = useLiveQuery(() => 
    db.suppliers.where('is_deleted').equals(0).toArray()
  , []);

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.phone?.includes(search)
  );

  const handleAddSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tenant?.id) return;
    
    const formData = new FormData(e.currentTarget);
    const newSupplier: Supplier = {
      id: uuidv4(),
      tenant_id: tenant.id,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      gstin: formData.get('gstin') as string,
      balance: 0,
      updated_at: new Date().toISOString(),
      is_deleted: 0,
      sync_status: 'pending',
      version_clock: Date.now()
    };

    await db.suppliers.add(newSupplier);
    toast.success("Supplier Added");
    setIsAddModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Supply Chain</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Vendor Management & Payables</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger>
            <Button className="bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl h-12 px-6">
              <Plus className="mr-2 h-5 w-5" /> New Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase italic">Add Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSupplier} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input name="name" placeholder="E.g., Tata Steel Distributors" required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input name="phone" placeholder="+91 ..." className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>GSTIN (Optional)</Label>
                <Input name="gstin" placeholder="22AAAAA0000A1Z5" className="h-12 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl">Save Supplier</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-4 h-5 w-5 text-zinc-400" />
        <Input 
          placeholder="Search vendors by name or phone..." 
          className="pl-12 h-14 rounded-2xl border-zinc-200 shadow-lg bg-white"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers?.map(sup => (
          <Card key={sup.id} className="border-zinc-100 shadow-xl rounded-[2rem] overflow-hidden hover:border-primary/20 transition-all group">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-14 w-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:bg-primary/5 transition-colors">
                  <Building2 className="h-7 w-7 text-zinc-400 group-hover:text-primary" />
                </div>
                <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest px-3 py-1 bg-zinc-50 border-zinc-200">Active Vendor</Badge>
              </div>
              
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight truncate">{sup.name}</h3>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    <Phone className="h-3 w-3" /> {sup.phone || 'No Contact'}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <FileText className="h-3 w-3" /> GST: {sup.gstin || 'Unregistered'}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-zinc-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Net Payable</p>
                  <p className="text-xl font-black tabular-nums text-red-500">₹{sup.balance.toLocaleString()}</p>
                </div>
                <Button size="sm" variant="ghost" className="rounded-lg font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5">
                  View Ledger <TrendingDown className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers?.length === 0 && (
        <div className="py-32 text-center opacity-20 flex flex-col items-center gap-4">
          <Building2 className="h-16 w-16" />
          <p className="font-black uppercase tracking-[0.3em] text-sm">No Suppliers Found</p>
        </div>
      )}
    </div>
  );
}
