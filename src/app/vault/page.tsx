"use client";

import { useState } from "react";
import { 
  Plus, Search, ShieldCheck, FileText, Download, 
  Trash2, UploadCloud, Camera, CheckCircle2, X,
  FileDigit, History, FileBadge, Receipt, MessageSquare,
  Loader2, Wallet, User, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Bill } from "@/lib/db";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";
import { GstInvoiceModal } from "@/components/GstInvoiceModal";
import { EWayBillModal } from "@/components/EWayBillModal";
import { cn } from "@/lib/utils";
import { ChevronRight, Image as ImageIcon } from "lucide-react";

export default function Vault() {
  const [newSupplier, setNewSupplier] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [isEwayModalOpen, setIsEwayModalOpen] = useState(false);
  const [viewOnlyData, setViewOnlyData] = useState<any>(null);
  
  const bills = useLiveQuery(() => db.bills.where('is_deleted').equals(0).toArray(), []) || [];
  const digitalBills = useLiveQuery(() => db.digital_bills.where('is_deleted').equals(0).toArray(), []) || [];

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
    const billId = `B-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`;
    await db.bills.add({
      id: billId,
      bill_no: billId,
      supplier: newSupplier.toUpperCase(),
      tenant_id: 'default_tenant',
      date: new Date().toLocaleDateString('en-GB'),
      total_amount: parseFloat(newAmount),
      amount: parseFloat(newAmount),
      status: "Pending",
      image_url: url,
      updated_at: new Date().toISOString(),
      is_deleted: 0,
      sync_status: 'pending',
      version_clock: Date.now()
    });
    setNewSupplier(""); setNewAmount(""); setCapturedFile(null); setIsUploading(false);
    toast.success("Bill added to Vault");
  };

  const handleShareWhatsApp = (bill: Bill) => {
    const text = encodeURIComponent(`Invoice Details: ${bill.supplier} - ₹${bill.total_amount} (${bill.date})`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const openDigitalBill = (bill: any) => {
    try {
      const data = JSON.parse(bill.data);
      setViewOnlyData(data);
      if (bill.type === 'gst') setIsGstModalOpen(true);
      else setIsEwayModalOpen(true);
    } catch { toast.error("Corrupted bill data"); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 md:pb-20 text-left px-4 md:px-0">
      <GstInvoiceModal isOpen={isGstModalOpen} onClose={() => setIsGstModalOpen(false)} viewOnlyData={viewOnlyData} />
      <EWayBillModal isOpen={isEwayModalOpen} onClose={() => setIsEwayModalOpen(false)} viewOnlyData={viewOnlyData} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter leading-none">GST Vault</h2>
          <p className="text-zinc-500 text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">Digital Records & Bill Storage</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setIsGstModalOpen(true)} className="flex-1 md:flex-none h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase text-[10px] tracking-widest px-6 shadow-xl">New GST Bill</Button>
          <Button onClick={() => setIsEwayModalOpen(true)} variant="outline" className="flex-1 md:flex-none h-11 rounded-xl font-black uppercase text-[10px] tracking-widest px-6 border-zinc-200 dark:border-zinc-800 dark:text-white">New eWay</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden text-left border">
            <CardHeader className="p-6 md:p-8 border-b border-zinc-50 dark:border-zinc-800">
              <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-3 dark:text-white"><FileBadge className="h-5 w-5 text-blue-600" /> Archive External Bill</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Supplier Name</Label>
                <Input value={newSupplier} onChange={e=>setNewSupplier(e.target.value)} placeholder="e.g. TATA STEEL" className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold shadow-inner dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Bill Amount ₹</Label>
                <Input type="number" value={newAmount} onChange={e=>setNewAmount(e.target.value)} placeholder="0.00" className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none font-black text-xl shadow-inner text-blue-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Bill Photo (Optional)</Label>
                <div className="border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 flex flex-col items-center justify-center gap-3 relative bg-zinc-50/50 dark:bg-zinc-950/50 group hover:border-blue-200 transition-all overflow-hidden cursor-pointer">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e=>setCapturedFile(e.target.files?.[0] || null)} />
                  {capturedFile ? (
                    <div className="relative w-full aspect-video"><img src={URL.createObjectURL(capturedFile)} className="w-full h-full object-cover rounded-xl" /></div>
                  ) : (
                    <><Camera className="h-8 md:h-10 w-8 md:w-10 text-zinc-300 group-hover:text-blue-500 transition-colors" /><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Upload Invoice Image</p></>
                  )}
                </div>
              </div>
              <Button onClick={handleAddBill} disabled={isUploading} className="w-full h-16 md:h-20 rounded-[1.5rem] md:rounded-[2.5rem] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all">
                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Authorise Storage"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden text-left border">
            <CardHeader className="p-6 md:p-8 border-b border-zinc-50 dark:border-zinc-800">
              <div className="flex justify-between items-center">
                 <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-3 dark:text-white"><History className="h-5 w-5 text-emerald-600" /> Vault Archives</CardTitle>
                 <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-none font-black text-[9px] uppercase px-3">{bills.length + digitalBills.length} RECORDS</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
                       <TableRow className="border-none h-12 md:h-14">
                          <TableHead className="pl-6 md:pl-8 font-black uppercase text-[8px] md:text-[9px] tracking-widest text-zinc-400">Bill Entry</TableHead>
                          <TableHead className="font-black uppercase text-[8px] md:text-[9px] tracking-widest text-zinc-400">Category</TableHead>
                          <TableHead className="font-black uppercase text-[8px] md:text-[9px] tracking-widest text-zinc-400 text-right pr-6 md:pr-8 whitespace-nowrap">Valuation</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {/* Digital Bills Section */}
                       {digitalBills.map(bill => (
                         <TableRow key={bill.id} onClick={() => openDigitalBill(bill)} className="border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50/50 cursor-pointer transition-colors h-16 md:h-20 group">
                            <TableCell className="pl-6 md:pl-8">
                               <div className="font-black text-zinc-900 dark:text-white uppercase italic text-sm md:text-base leading-none mb-1 group-hover:text-blue-600">{bill.customer_name}</div>
                               <div className="text-[8px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="h-3 w-3" /> {new Date(bill.date).toLocaleDateString('en-GB')}</div>
                            </TableCell>
                            <TableCell>
                               <Badge className={cn("rounded-lg font-black text-[8px] md:text-[9px] uppercase", bill.type === 'gst' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600")}>{bill.type === 'gst' ? 'Tax Invoice' : 'eWay Bill'}</Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 md:pr-8">
                               <div className="flex items-center justify-end gap-2 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all"><FileText className="h-4 w-4" /><ChevronRight className="h-4 w-4" /></div>
                            </TableCell>
                         </TableRow>
                       ))}

                       {/* Physical/Manual Bills */}
                       {bills.map(bill => (
                         <TableRow key={bill.id} className="border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50/50 transition-colors h-16 md:h-20">
                            <TableCell className="pl-6 md:pl-8">
                               <div className="font-black text-zinc-900 dark:text-white uppercase italic text-sm md:text-base leading-none mb-1">{bill.supplier}</div>
                               <div className="text-[8px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="h-3 w-3" /> {bill.date}</div>
                            </TableCell>
                            <TableCell>
                               <Badge className={cn("rounded-lg font-black text-[8px] md:text-[9px] uppercase", bill.status === 'Paid' || bill.status === 'paid' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>{bill.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 md:pr-8">
                               <div className="font-black text-base md:text-xl tracking-tighter dark:text-white mb-1">₹{bill.total_amount.toLocaleString()}</div>
                               <div className="flex gap-2 justify-end">
                                  {bill.image_url && <Button variant="ghost" size="icon" onClick={()=>window.open(bill.image_url, '_blank')} className="h-8 w-8 text-blue-500"><ImageIcon className="h-4 w-4" /></Button>}
                                  <Button variant="ghost" size="icon" onClick={()=>handleShareWhatsApp(bill)} className="h-8 w-8 text-emerald-500"><MessageSquare className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" onClick={async () => { if(confirm("Purge?")) await db.bills.update(bill.id, { is_deleted: 1 }); }} className="h-8 w-8 text-red-400"><Trash2 className="h-4 w-4" /></Button>
                               </div>
                            </TableCell>
                         </TableRow>
                       ))}
                       {bills.length === 0 && digitalBills.length === 0 && (
                         <TableRow><TableCell colSpan={3} className="h-64 text-center opacity-20 font-black uppercase text-[10px] tracking-[0.2em]">Vault Empty</TableCell></TableRow>
                       )}
                    </TableBody>
                 </Table>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
