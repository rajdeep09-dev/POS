"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Barcode as BarcodeIcon, ShieldCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeViewModalProps {
  variant: any;
  isOpen: boolean;
  onClose: () => void;
}

export function BarcodeViewModal({ variant, isOpen, onClose }: BarcodeViewModalProps) {
  if (!variant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] bg-white dark:bg-zinc-900 border-none shadow-2xl p-10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter dark:text-white">Security & Tracking</DialogTitle>
        </DialogHeader>
        
        <div className="py-8 flex flex-col items-center gap-6">
           <div className="w-full bg-zinc-50 dark:bg-zinc-800 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-700 flex flex-col items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck className="h-20 w-20 dark:text-white" /></div>
              
              <div className="text-center space-y-1">
                 <h4 className="font-black text-xl uppercase italic dark:text-white">{variant.productName}</h4>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{variant.size}</p>
              </div>

              {/* Barcode Display */}
              <div className="bg-white p-4 rounded-xl shadow-inner border border-zinc-100 flex flex-col items-center gap-2">
                 <div className="text-3xl font-mono tracking-[0.3em] font-black text-zinc-900">
                    {variant.barcode || "NO BARCODE"}
                 </div>
                 <div className="h-10 w-64 bg-zinc-900 rounded-sm flex items-center justify-center gap-1 px-2">
                    {Array.from({length: 40}).map((_, i) => (
                       <div key={i} className={`h-full bg-white ${Math.random() > 0.5 ? 'w-[1px]' : 'w-[2px]'}`} />
                    ))}
                 </div>
              </div>

              <div className="flex gap-2">
                 <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">UID: {variant.id.slice(0,8)}</Badge>
                 <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-3 py-1 dark:text-white dark:border-zinc-600">Stock: {variant.stock}</Badge>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 w-full">
              <Button onClick={() => window.print()} variant="outline" className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-700 dark:text-white font-black uppercase text-[10px] tracking-widest">
                 <Printer className="h-4 w-4 mr-2" /> Print Label
              </Button>
              <Button onClick={onClose} className="h-14 rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white font-black uppercase text-[10px] tracking-widest">
                 Close
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
