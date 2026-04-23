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
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, PackageOpen, Layers, Box, Boxes, Info, X } from "lucide-react";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { generateBarcode } from "@/lib/barcode";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const columnGuide = [
    { key: "name", en: "Product Name", bn: "পণ্যের নাম" },
    { key: "department", en: "Category/Dept", bn: "বিভাগ" },
    { key: "size", en: "Size (e.g. 5L)", bn: "মাপ/সাইজ" },
    { key: "unit", en: "pcs or kg", bn: "একক (পিস/কেজি)" },
    { key: "qty", en: "Opening Stock", bn: "মজুত পরিমাণ" },
    { key: "mrp", en: "Retail Price", bn: "খুচরা মূল্য" },
    { key: "is_combo", en: "Combo? (yes/no)", bn: "কম্বো? (হ্যাঁ/না)" },
    { key: "units_in_pack", en: "Units per Combo", bn: "প্যাকে কয়টি থাকে" },
    { key: "bundle_price", en: "Combo Pack Price", bn: "কম্বো মোট মূল্য" },
    { key: "image_url", en: "Image Link", bn: "ছবির লিঙ্ক" },
    { key: "barcode", en: "Manual Barcode", bn: "বারকোড (ঐচ্ছিক)" },
  ];

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
            let val = currentline[s]?.trim();
            // Map common aliases
            if (header === 'department') header = 'category';
            if (header === 'mrp') header = 'base_price';
            obj[header] = val;
          });
          result.push(obj);
        }
        setPreviewData(result);
        toast.success(`Analysis Complete: ${result.length} items parsed`);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;
    setIsProcessing(true);
    const id = toast.loading("Deploying Master Catalog...");

    try {
      const now = new Date().toISOString();
      await db.transaction('rw', [db.products, db.variants, db.categories], async () => {
        for (const p of previewData) {
          const productId = uuidv4();
          
          // 1. Ensure Department exists
          const deptName = (p.category || "GENERAL").toUpperCase();
          const existingDept = await db.categories.where('name').equals(deptName).first();
          if (!existingDept) {
            await db.categories.add({
              id: uuidv4(),
              name: deptName,
              updated_at: now,
              is_deleted: 0,
              sync_status: 'pending',
              version_clock: Date.now(),
              tenant_id: 'default'
            });
          }

          // 2. Create Master Product
          await db.products.add({
            id: productId,
            name: (p.name || "UNNAMED").toUpperCase(),
            category: deptName,
            image_url: p.image_url || "",
            created_at: now,
            updated_at: now,
            is_deleted: 0,
            sync_status: 'pending',
            version_clock: Date.now(),
            tenant_id: 'default',
            tax_rate: 0
          });

          // 3. Logic: Is it a Combo?
          const isCombo = p.is_combo?.toLowerCase() === 'yes';
          const pricingType = isCombo ? 'bundle' : 'standard';

          // 4. Create Variant
          await db.variants.add({
            id: uuidv4(),
            product_id: productId,
            size: (p.size || "STANDARD").toUpperCase(),
            unit: (p.unit || "pcs").toLowerCase() as any,
            stock: parseInt(p.qty || "0"),
            dented_stock: 0,
            cost_price: parseFloat(p.msp || p.base_price || "0"),
            msp: parseFloat(p.msp || p.base_price || "0"),
            base_price: parseFloat(p.base_price || "0"),
            barcode: p.barcode || undefined,
            image_url: p.image_url || "",
            pricing_type: pricingType,
            bundle_qty: isCombo ? parseInt(p.bundle_qty || "0") : undefined,
            bundle_price: isCombo ? parseFloat(p.bundle_price || "0") : undefined,
            units_per_combo: isCombo ? parseInt(p.bundle_qty || "1") : 1,
            created_at: now,
            updated_at: now,
            is_deleted: 0,
            sync_status: 'pending',
            version_clock: Date.now(),
            tenant_id: 'default',
            low_stock_threshold: 5
          });
        }
      });
      toast.success("All Items Deployed Successfully", { id });
      setPreviewData([]);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Deployment Failed", { id });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] rounded-[2.5rem] bg-white dark:bg-zinc-900 border-none shadow-2xl overflow-hidden p-0">
        <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3 dark:text-white text-left">
               <FileSpreadsheet className="h-8 w-8 text-blue-600" /> Enterprise Bulk Importer
            </DialogTitle>
          </DialogHeader>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowGuide(!showGuide)}
            className={cn("h-12 w-12 rounded-full", showGuide ? "bg-blue-600 text-white" : "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm")}
          >
            <Info className="h-6 w-6" />
          </Button>
        </div>

        <div className="p-10 space-y-8 relative">
          <AnimatePresence>
            {showGuide && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 bg-white dark:bg-zinc-900 p-10 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">CSV Column Guide</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowGuide(false)}><X className="h-6 w-6" /></Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
                  {columnGuide.map((col) => (
                    <div key={col.key} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                      <p className="font-black text-blue-600 text-[10px] uppercase tracking-widest mb-1">{col.key}</p>
                      <p className="font-bold text-sm dark:text-white">{col.en}</p>
                      <p className="text-xs text-zinc-500 font-bold mt-0.5">{col.bn}</p>
                    </div>
                  ))}
                </div>
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2">
                   <Button onClick={() => setShowGuide(false)} className="rounded-full px-10 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase text-[10px] tracking-widest shadow-2xl">Got it</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {previewData.length === 0 ? (
            <div className="border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] py-20 flex flex-col items-center justify-center gap-6 relative group transition-all hover:border-blue-400 bg-zinc-50/30 dark:bg-zinc-950/20 text-center">
               <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
               <div className="p-8 bg-white dark:bg-zinc-900 rounded-full shadow-xl border border-zinc-50 dark:border-zinc-800"><UploadCloud className="h-12 w-12 text-zinc-300 group-hover:text-blue-500 transition-colors animate-pulse" /></div>
               <div className="space-y-4 px-10">
                  <p className="font-black uppercase text-sm tracking-[0.2em] text-zinc-400">Import Enterprise CSV</p>
                  <div className="grid grid-cols-2 gap-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400 leading-loose">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <span className="text-blue-600">Core Columns</span><br/>
                      name, department, size, unit, qty, mrp
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <span className="text-emerald-600">Combo Columns</span><br/>
                      is_combo (yes/no), units_in_pack, bundle_price
                    </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-8 text-left">
               <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pre-Import Analysis</span>
                  </div>
                  <Badge className="bg-blue-600 text-white border-none px-4 py-1.5 rounded-xl font-black">{previewData.length} SKUS ANALYSED</Badge>
               </div>
               <ScrollArea className="h-[45vh] rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6">
                  <div className="space-y-3">
                     {previewData.map((item, i) => {
                       const isCombo = item.is_combo?.toLowerCase() === 'yes';
                       return (
                        <div key={i} className="flex justify-between items-center p-5 bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-sm border border-zinc-50 dark:border-zinc-800 group hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800">
                                {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <PackageOpen className="h-6 w-6 text-zinc-300" />}
                              </div>
                              <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-black text-sm uppercase italic dark:text-white">{item.name}</p>
                                    <Badge className={cn("text-[8px] font-black uppercase tracking-widest border-none", isCombo ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600")}>
                                      {isCombo ? "Combo" : "Standard"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                    <Layers className="h-3 w-3" /> {item.category || item.department || "General"} &bull; {item.size}
                                  </div>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="font-black text-sm dark:text-white">₹{item.mrp || item.base_price}</p>
                                {isCombo && (
                                  <div className="flex flex-col items-end">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Pack: ₹{item.bundle_price}</p>
                                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Qty: {item.units_in_pack} units</p>
                                  </div>
                                )}
                            </div>
                        </div>
                       );
                     })}
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
