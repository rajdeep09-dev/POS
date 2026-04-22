"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, PackageOpen } from "lucide-react";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { generateBarcode } from "@/lib/barcode";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const result = [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const obj: any = {};
          const currentline = lines[i].split(',');
          headers.forEach((header, s) => {
            obj[header] = currentline[s]?.trim();
          });
          result.push(obj);
        }
        setPreviewData(result);
        toast.success(`Parsed ${result.length} items from CSV`);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;
    setIsProcessing(true);
    const id = toast.loading("Deploying bulk catalog...");

    try {
      const now = new Date().toISOString();
      await db.transaction('rw', [db.products, db.variants], async () => {
        for (const p of previewData) {
          const productId = uuidv4();
          
          // 1. Create Master Product
          await db.products.add({
            id: productId,
            name: (p.name || "UNNAMED").toUpperCase(),
            category: (p.category || "GENERAL").toUpperCase(),
            image_url: p.image_url || "",
            created_at: now,
            updated_at: now,
            is_deleted: 0,
            sync_status: 'pending',
            version_clock: Date.now()
          });

          // 2. Determine Pricing Logic
          const isBundle = p.bundle_qty && p.bundle_price;
          const pricingType = isBundle ? 'bundle' : 'standard';

          // 3. Create Variant
          await db.variants.add({
            id: uuidv4(),
            product_id: productId,
            size: (p.size || "STANDARD").toUpperCase(),
            unit: (p.unit || "pcs").toLowerCase() as any,
            stock: parseInt(p.qty || "0"),
            dented_stock: 0,
            cost_price: parseFloat(p.msp || p.mrp || "0"),
            msp: parseFloat(p.msp || p.mrp || "0"),
            base_price: parseFloat(p.mrp || "0"),
            barcode: p.barcode || generateBarcode(),
            image_url: p.image_url || undefined,
            pricing_type: pricingType,
            bundle_qty: isBundle ? parseInt(p.bundle_qty) : undefined,
            bundle_price: isBundle ? parseFloat(p.bundle_price) : undefined,
            units_per_combo: parseInt(p.units_in_pack || "1"),
            created_at: now,
            updated_at: now,
            is_deleted: 0,
            sync_status: 'pending',
            version_clock: Date.now()
          });
        }
      });
      toast.success(`${previewData.length} Items Deployed Successfully`, { id });
      setPreviewData([]);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Bulk Deployment Failed", { id });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] bg-white dark:bg-zinc-900 border-none shadow-2xl overflow-hidden p-0">
        <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3 dark:text-white">
               <FileSpreadsheet className="h-8 w-8 text-emerald-600" /> Bulk Import Pro V2
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-10 space-y-8">
          {previewData.length === 0 ? (
            <div className="border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] py-24 flex flex-col items-center justify-center gap-6 relative group transition-all hover:border-blue-400 dark:hover:border-blue-900 bg-zinc-50/30 dark:bg-zinc-950/20">
               <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
               <div className="p-8 bg-white dark:bg-zinc-900 rounded-full shadow-xl border border-zinc-50 dark:border-zinc-800"><UploadCloud className="h-16 w-16 text-zinc-300 group-hover:text-blue-500 transition-colors animate-pulse" /></div>
               <div className="text-center space-y-3 px-10">
                  <p className="font-black uppercase text-sm tracking-[0.2em] text-zinc-400">Deploy Enterprise CSV Catalog</p>
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                    Required Columns: <span className="text-blue-600">name, category, size, unit, qty, mrp</span><br/>
                    Optional: <span className="text-emerald-600">msp, barcode, image_url, bundle_qty, bundle_price, units_in_pack</span>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-8">
               <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Pre-Deployment Analysis</span>
                  <Badge className="bg-emerald-500 text-white border-none px-4 py-1 rounded-lg font-black">{previewData.length} ITEMS READY</Badge>
               </div>
               <ScrollArea className="h-80 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6">
                  <div className="space-y-3">
                     {previewData.map((item, i) => (
                       <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-50 dark:border-zinc-800 group hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <PackageOpen className="h-5 w-5 text-zinc-300" />}
                             </div>
                             <div className="text-left">
                                <p className="font-black text-xs uppercase italic truncate w-48 dark:text-white">{item.name}</p>
                                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{item.size} &bull; {item.category}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-xs text-blue-600">₹{item.mrp}</p>
                             {item.bundle_price && <p className="text-[8px] font-black text-emerald-500 uppercase">Combo: ₹{item.bundle_price}</p>}
                          </div>
                       </div>
                     ))}
                  </div>
               </ScrollArea>
               <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setPreviewData([])} className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest border-zinc-200 dark:border-zinc-800">Discard Batch</Button>
                  <Button onClick={handleImport} disabled={isProcessing} className="flex-[2] h-16 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-transform">
                    {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : `AUTHORISE BULK DEPLOYMENT`}
                  </Button>
               </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
