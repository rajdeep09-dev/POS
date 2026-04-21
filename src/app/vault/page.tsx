"use client";

import { useState } from "react";
import { FileText, UploadCloud, Search, CheckCircle2, Clock, Camera, Filter, Link as LinkIcon, Image as ImageIcon, Trash2, Plus, Eye } from "lucide-react";
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

  const handleAddBill = async () => {
    if (!newSupplier || !newAmount) return toast.error("Enter all fields");
    setIsUploading(true);
    let url = undefined;
    if (capturedFile) {
      try {
        const compressed = await imageCompression(capturedFile, { maxSizeMB: 0.2 });
        const name = `${uuidv4()}.jpg`;
        const { error } = await supabase.storage.from('product-images').upload(`bills/${name}`, compressed);
        if (!error) {
          const { data } = supabase.storage.from('product-images').getPublicUrl(`bills/${name}`);
          url = data.publicUrl;
        }
      } catch {}
    }
    await db.bills.add({
      id: `B-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      supplier: newSupplier.toUpperCase(),
      date: new Date().toLocaleDateString('en-GB'),
      amount: parseInt(newAmount),
      status: "Pending",
      image_url: url,
      updated_at: new Date().toISOString(),
      is_deleted: 0,
      sync_status: 'pending',
      version_clock: Date.now()
    });
    setNewSupplier(""); setNewAmount(""); setCapturedImage(null); setIsUploading(false);
    toast.success("Bill added");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 text-left">
      <GstInvoiceModal isOpen={isGstModalOpen} onClose={() => setIsGstModalOpen(false)} />
      <EWayBillModal isOpen={isEwayModalOpen} onClose={() => setIsEwayModalOpen(false)} />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 uppercase italic">Vault</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">Digital Invoice Archive</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsGstModalOpen(true)} className="h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest border-zinc-200">New GST</Button>
          <Dialog onOpenChange={o => !o && setCapturedImage(null)}>
            <DialogTrigger render={<Button className="h-11 rounded-xl bg-zinc-900 font-bold uppercase text-[10px] tracking-widest px-6"><Camera className="mr-2 h-4 w-4" /> Scan Bill</Button>} />
            <DialogContent className="rounded-2xl p-6">
              <DialogHeader><DialogTitle>Digitize Bill</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <Input value={newSupplier} onChange={e=>setNewSupplier(e.target.value)} placeholder="Supplier Name" className="h-12 rounded-xl" />
                <Input type="number" value={newAmount} onChange={e=>setNewAmount(e.target.value)} placeholder="Amount" className="h-12 rounded-xl" />
                <div className="border-2 border-dashed rounded-xl h-40 flex items-center justify-center relative bg-zinc-50">
                   <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                     const f = e.target.files?.[0];
                     if(f) { setCapturedImage(URL.createObjectURL(f)); setCapturedFile(f); }
                   }} />
                   {capturedImage ? <img src={capturedImage} className="absolute inset-0 w-full h-full object-cover rounded-xl" /> : <Camera className="h-8 w-8 text-zinc-300" />}
                </div>
                <Button onClick={handleAddBill} disabled={isUploading} className="w-full h-12 rounded-xl bg-zinc-900 font-bold">{isUploading ? "Processing..." : "Save to Vault"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-zinc-200 shadow-lg rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest">Supplier</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-right">Amount</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-right">Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.filter(b => b.supplier.toLowerCase().includes(search.toLowerCase())).map(bill => (
              <TableRow key={bill.id}>
                <TableCell className="font-bold uppercase py-4">{bill.supplier}</TableCell>
                <TableCell className="text-right font-black">₹{bill.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={bill.status === 'Paid' ? 'default' : 'outline'} className="rounded-lg text-[9px] font-black">{bill.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                   <div className="flex gap-2 justify-end">
                      {bill.image_url && <Button variant="ghost" size="icon" onClick={() => window.open(bill.image_url, '_blank')}><Eye className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon" onClick={async () => { if(confirm("Delete?")) await db.bills.update(bill.id, { is_deleted: 1 }); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
