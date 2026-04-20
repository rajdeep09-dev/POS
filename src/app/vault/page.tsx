"use client";

import { useState } from "react";
import { 
  FileText, UploadCloud, Search, CheckCircle2, 
  Clock, Camera, Filter, Link as LinkIcon, 
  Image as ImageIcon, Trash2, Plus, Zap,
  ShieldCheck, ArrowRight, Download, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import imageCompression from 'browser-image-compression';
import { GstInvoiceModal } from "@/components/GstInvoiceModal";
import { EWayBillModal } from "@/components/EWayBillModal";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export default function Vault() {
  const [search, setSearch] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [isEwayModalOpen, setIsEwayModalOpen] = useState(false);
  
  const bills = useLiveQuery(() => db.bills.where('is_deleted').equals(0).toArray(), []) || [];
  const digitalBills = useLiveQuery(() => db.digital_bills.where('is_deleted').equals(0).toArray(), []) || [];
  
  const pendingAmount = bills.filter(b => b.status === "Pending").reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddBill = async () => {
    if (!newSupplier || !newAmount) {
      toast.error("Please enter supplier and amount");
      return;
    }

    setIsUploading(true);
    let finalBillUrl = undefined;

    if (capturedFile) {
      toast.info("Digitizing physical invoice...", { id: 'bill-save' });
      try {
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true };
        const compressedFile = await imageCompression(capturedFile, options);
        
        const fileExt = capturedFile.name.split('.').pop() || 'jpg';
        const fileName = `${uuidv4()}.${fileExt}`;
        const { error } = await supabase.storage
          .from('product-images')
          .upload(`bills/${fileName}`, compressedFile);

        if (!error) {
          const { data } = supabase.storage.from('product-images').getPublicUrl(`bills/${fileName}`);
          finalBillUrl = data.publicUrl;
          toast.success("Holographic scan completed", { id: 'bill-save' });
        }
      } catch (err) {
        console.error(err);
        toast.error("Cloud scan failed, saving data only", { id: 'bill-save' });
      }
    }
    
    try {
      const now = new Date().toISOString();
      await db.bills.add({
        id: `B-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        supplier: newSupplier.toUpperCase(),
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        amount: parseInt(newAmount),
        status: "Pending",
        image_url: finalBillUrl,
        updated_at: now,
        is_deleted: 0,
        sync_status: 'pending',
        version_clock: Date.now()
      });
      
      toast.success("Bill secured in Vault");
      setNewSupplier(""); setNewAmount(""); setCapturedImage(null); setCapturedFile(null);
    } catch {
      toast.error("Vault entry failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    await db.bills.update(id, { status: "Paid", updated_at: new Date().toISOString(), sync_status: 'pending' });
    toast.success("Transaction Cleared");
  };

  const handleDeleteBill = async (id: string) => {
    if (!confirm("Permenantly remove from vault?")) return;
    await db.bills.update(id, { is_deleted: 1, updated_at: new Date().toISOString(), sync_status: 'pending' });
    toast.success("Entry Purged");
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 max-w-[1600px] mx-auto overflow-hidden px-4 md:px-6">
      <GstInvoiceModal isOpen={isGstModalOpen} onClose={() => setIsGstModalOpen(false)} />
      <EWayBillModal isOpen={isEwayModalOpen} onClose={() => setIsEwayModalOpen(false)} />

      {/* ELITE VAULT HEADER */}
      <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center shrink-0 py-2">
        <div className="text-left">
          <h2 className="text-4xl font-black tracking-tight text-zinc-900 flex items-center gap-4 italic uppercase">
             <div className="p-3 bg-zinc-900 text-white rounded-2xl shadow-xl shadow-zinc-900/20"><ShieldCheck className="h-8 w-8" /></div> GST Vault
          </h2>
          <p className="text-zinc-500 mt-2 text-xs font-black uppercase tracking-[0.2em] opacity-60 pl-1">Secure Digital Archive & Supplier Ledger</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase text-[9px] tracking-[0.2em] border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 transition-all active:scale-95" onClick={() => setIsGstModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New GST Bill
          </Button>
          <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase text-[9px] tracking-[0.2em] border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 transition-all active:scale-95" onClick={() => setIsEwayModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New eWay Bill
          </Button>
          
          <Dialog onOpenChange={(open) => { if(!open) setCapturedImage(null) }}>
            <DialogTrigger>
               <div className="bg-zinc-900 hover:bg-black text-white shadow-2xl shadow-zinc-900/40 rounded-xl h-12 px-8 font-black transition-all active:scale-95 uppercase text-[9px] tracking-[0.2em] flex items-center justify-center cursor-pointer">
                 <Camera className="mr-2 h-4 w-4 text-blue-400" /> Digitise Invoice
               </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none shadow-2xl bg-white/95 backdrop-blur-3xl p-10">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-zinc-900 text-left italic uppercase tracking-tighter">Vault Engine</DialogTitle>
                <DialogDescription className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] text-left">High-fidelity invoice digitisation</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-8 py-6">
                <Tabs defaultValue="camera" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-100 rounded-2xl p-1 h-12">
                    <TabsTrigger value="camera" className="rounded-xl data-[state=active]:bg-white font-black text-[9px] uppercase tracking-widest flex gap-2 items-center transition-all"><Camera className="h-4 w-4" /> Scanner</TabsTrigger>
                    <TabsTrigger value="file" className="rounded-xl data-[state=active]:bg-white font-black text-[9px] uppercase tracking-widest flex gap-2 items-center transition-all"><UploadCloud className="h-4 w-4" /> Upload</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="camera" className="mt-6">
                    <div className="relative group overflow-hidden border-2 border-dashed border-zinc-200 rounded-[2.5rem] flex flex-col items-center justify-center bg-zinc-50 h-64 transition-all hover:border-zinc-300">
                      <input type="file" accept="image/*" capture="environment" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if(file) {
                          setCapturedImage(URL.createObjectURL(file));
                          setCapturedFile(file);
                        }
                      }} />
                      {capturedImage ? (
                        <div className="relative w-full h-full">
                           <img src={capturedImage} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-blue-600/10 animate-pulse" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                           <div className="p-6 bg-white rounded-full shadow-inner"><Camera className="h-10 w-10 text-zinc-200" /></div>
                           <p className="font-black text-[9px] uppercase tracking-widest text-zinc-400">Target Invoice & Snap</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="file" className="mt-6">
                    <div className="relative group overflow-hidden border-2 border-dashed border-zinc-200 rounded-[2.5rem] flex flex-col items-center justify-center bg-zinc-50 h-64">
                      <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if(file) {
                          setCapturedImage(URL.createObjectURL(file));
                          setCapturedFile(file);
                        }
                      }} />
                      {capturedImage ? <img src={capturedImage} className="w-full h-full object-cover" /> : <UploadCloud className="h-10 w-10 text-zinc-300" />}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <Label className="font-black text-[9px] uppercase tracking-widest text-zinc-400 ml-1">Supplier Entity</Label>
                    <Input value={newSupplier} onChange={e => setNewSupplier(e.target.value)} placeholder="MILTON MFG" className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold" />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="font-black text-[9px] uppercase tracking-widest text-zinc-400 ml-1">Invoice Value (₹)</Label>
                    <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0" className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-black text-xl italic tracking-tighter" />
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddBill} 
                  disabled={isUploading}
                  className="w-full h-20 rounded-[2rem] bg-zinc-900 text-white font-black uppercase tracking-[0.3em] text-xs shadow-2xl active:scale-95 transition-all"
                >
                  {isUploading ? <Zap className="h-6 w-6 animate-spin text-blue-400" /> : 'Authorise Entry'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* QUICK STATS BAR */}
      <div className="grid gap-6 md:grid-cols-4 shrink-0">
        <Card className="border-none shadow-2xl bg-zinc-900 text-white rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardContent className="p-8 relative z-10">
            <h3 className="font-black text-zinc-500 flex items-center gap-2 mb-2 text-[9px] uppercase tracking-[0.3em]">
              Pending Outflow
            </h3>
            <div className="text-4xl font-black tracking-tighter italic">₹{pendingAmount.toLocaleString()}</div>
            <div className="mt-4">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-white/5 px-4 py-2 rounded-lg border border-white/5 inline-block">
                {bills.filter(b => b.status === "Pending").length} UNPAID INVOICES
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/40">
          <CardContent className="p-8">
            <h3 className="font-black text-zinc-400 flex items-center gap-2 mb-2 text-[9px] uppercase tracking-[0.3em]">
              Digital Archives
            </h3>
            <div className="text-4xl font-black tracking-tighter italic text-zinc-900">{digitalBills.length}</div>
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-4 italic">Cloud Synced & Verified</p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH & ACTION AREA */}
      <div className="relative group shrink-0">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
        <Input 
          placeholder="Filter vault by supplier, bill ID, or date..." 
          className="pl-14 h-16 text-lg bg-white/70 backdrop-blur-3xl border-zinc-100 shadow-2xl shadow-zinc-200/50 rounded-2xl font-bold tracking-tight italic"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* VAULT LEDGER (STATIC SCROLL) */}
      <Card className="flex-1 border-none shadow-2xl bg-white/70 backdrop-blur-3xl rounded-[3.5rem] overflow-hidden border border-white/40 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="bg-zinc-50/50 border-none sticky top-0 z-20 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-none h-16">
                <TableHead className="pl-10 font-black uppercase text-[10px] tracking-widest text-zinc-400">Supplier Entity</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Entry Reference</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-zinc-400">Value</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-zinc-400">Workflow</TableHead>
                <TableHead className="pr-10 h-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.filter(b => b.supplier.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase())).map((bill) => (
                <TableRow key={bill.id} className="hover:bg-zinc-50/80 transition-all border-none group">
                  <TableCell className="pl-10 py-8 text-left">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center font-black text-zinc-900 border border-zinc-100 text-xl italic group-hover:scale-110 transition-transform">
                        {bill.supplier.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <span className="font-black text-zinc-900 group-hover:text-blue-600 transition-colors text-xl tracking-tighter uppercase italic">
                          {bill.supplier}
                        </span>
                        <div className="flex items-center gap-2">
                           <Badge className="bg-zinc-50 border-zinc-100 text-zinc-400 text-[8px] font-black uppercase px-2 rounded-md">SUPPLIER</Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8 text-left">
                    <div className="font-black text-zinc-900 text-sm tracking-tight">{bill.id}</div>
                    <div className="text-[10px] font-bold text-zinc-400 mt-1.5 uppercase tracking-widest flex items-center gap-2">
                       <Clock className="h-3 w-3" /> {bill.date}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-8">
                    <span className="font-black text-zinc-900 text-3xl tracking-tighter italic leading-none">₹{bill.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right py-8">
                    {bill.status === "Paid" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Cleared
                      </Badge>
                    ) : (
                      <button onClick={() => handleMarkPaid(bill.id)} className="bg-amber-500/10 text-amber-600 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500 hover:text-white transition-all ml-auto">
                        <Clock className="h-4 w-4" /> Mark Paid
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-10 py-8">
                    <div className="flex gap-3 justify-end">
                      {bill.image_url && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-11 w-11 rounded-2xl border-zinc-100 bg-white hover:bg-zinc-900 hover:text-white shadow-sm transition-all"
                          onClick={() => window.open(bill.image_url, '_blank')}
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      )}
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-zinc-100 bg-white text-zinc-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 shadow-sm transition-all" onClick={() => handleDeleteBill(bill.id)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {bills.length === 0 && (
                <TableRow>
                   <TableCell colSpan={5} className="py-40">
                      <div className="flex flex-col items-center justify-center opacity-20 italic gap-6 text-zinc-400">
                         <div className="p-12 bg-zinc-100 rounded-full shadow-inner"><FileText className="h-24 w-24" /></div>
                         <p className="font-black uppercase tracking-[0.3em] text-sm">Vault is currently empty</p>
                      </div>
                   </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}
