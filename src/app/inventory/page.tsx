"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, ChevronDown, PackageOpen, Tag, Barcode, 
  Camera, UploadCloud, AlertTriangle, Truck, Trash2, Link as LinkIcon,
  Filter, Package, ArrowRight, Zap, Image as ImageIcon,
  Loader2, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import imageCompression from 'browser-image-compression';
import { BulkImportModal } from "@/components/BulkImportModal";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "@/components/ProductCard";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // New Product Modal States
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  
  // New Variant Modal States
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [newSize, setNewSize] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newMsp, setNewMsp] = useState("");
  const [newUnit, setNewUnit] = useState("pcs");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const products = useLiveQuery(() => db.products.where('is_deleted').equals(0).toArray()) || [];
  const variants = useLiveQuery(() => db.variants.where('is_deleted').equals(0).toArray()) || [];

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleAddMasterProduct = async () => {
    if (!newProductName || !newProductCategory) {
      toast.error("Please fill all fields");
      return;
    }
    const now = new Date().toISOString();
    await db.products.add({ 
      id: uuidv4(), 
      name: newProductName.toUpperCase(), 
      category: newProductCategory.toUpperCase(), 
      created_at: now,
      updated_at: now,
      is_deleted: 0,
      sync_status: 'pending',
      version_clock: Date.now()
    });
    toast.success("Master Product added!");
    setNewProductName("");
  };

  const handleAddVariant = async () => {
    if (!selectedProductId || !newSize || !newStock || !newPrice || !newMsp) {
      toast.error("Please fill all fields");
      return;
    }

    setIsUploading(true);
    let finalImageUrl = newImageUrl || undefined;

    try {
      if (capturedFile) {
        toast.info("Uploading via One-Touch Engine...", { id: 'upload' });
        finalImageUrl = await uploadToCloudinary(capturedFile);
        toast.success("Image secured in cloud", { id: 'upload' });
      }

      const now = new Date().toISOString();
      await db.variants.add({
        id: uuidv4(),
        product_id: selectedProductId,
        size: newSize,
        unit: newUnit as any,
        stock: parseInt(newStock),
        dented_stock: 0,
        cost_price: parseInt(newMsp),
        msp: parseInt(newMsp),
        base_price: parseInt(newPrice),
        image_url: finalImageUrl,
        pricing_type: 'standard',
        created_at: now,
        updated_at: now,
        is_deleted: 0,
        sync_status: 'pending',
        version_clock: Date.now()
      });

      toast.success("Variant deployed to inventory");
      setNewSize(""); setNewStock(""); setNewPrice(""); setNewMsp(""); setCapturedFile(null); setCapturedImage(null);
      setSelectedProductId(null);
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVariant = async (id: string) => {
    if (!confirm("Remove this variant?")) return;
    await db.variants.update(id, { is_deleted: 1, updated_at: new Date().toISOString(), sync_status: 'pending' });
    toast.success("Variant removed");
  };

  const filteredVariants = variants.map(v => {
    const p = products.find(prod => prod.id === v.product_id);
    return {
      ...v,
      productName: p?.name || "Unknown",
      category: p?.category || "General",
      parentImage: p?.image_url
    };
  }).filter(v => {
    const matchesSearch = v.productName.toLowerCase().includes(search.toLowerCase()) || 
                          v.size.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 max-w-[1600px] mx-auto overflow-hidden px-4 md:px-6">
      
      {/* ELITE HEADER (STATIC) */}
      <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center shrink-0 py-2">
        <div className="text-left">
          <h2 className="text-4xl font-black tracking-tight text-zinc-900 flex items-center gap-4 italic uppercase">
             <div className="p-3 bg-zinc-900 text-white rounded-2xl shadow-xl shadow-zinc-900/20"><Package className="h-8 w-8" /></div> Inventory
          </h2>
          <p className="text-zinc-500 mt-2 text-xs font-black uppercase tracking-[0.2em] opacity-60 pl-1">Global Stock Control & Master Catalog</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
             <Input 
                placeholder="Search Inventory..." 
                className="pl-11 h-12 w-64 rounded-xl border-zinc-200 bg-white shadow-sm focus:ring-2 focus:ring-zinc-900/10 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
          </div>

          <div className="flex gap-3">
             <Button variant="outline" className="h-12 px-6 rounded-xl border-zinc-200 text-zinc-600 font-bold uppercase text-[9px] tracking-widest gap-2 shadow-sm" onClick={() => (window as any).dispatchEvent(new CustomEvent('open-bulk-import'))}>
                <UploadCloud className="h-4 w-4" /> Bulk Import
             </Button>
             <Dialog>
                <DialogTrigger>
                  <div className="h-12 px-6 rounded-xl bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" /> Add Product
                  </div>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] bg-white border-none shadow-2xl p-8 max-w-md">
                   <DialogHeader>
                      <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Add Master Product</DialogTitle>
                      <DialogDescription className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Define a new brand or category head</DialogDescription>
                   </DialogHeader>
                   <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400 ml-1">Product Name</Label>
                        <Input value={newProductName} onChange={e=>setNewProductName(e.target.value)} className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold text-lg" placeholder="e.g. ASHIRWAD BUCKET" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400 ml-1">Category</Label>
                        <Input value={newProductCategory} onChange={e=>setNewProductCategory(e.target.value)} className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold" placeholder="e.g. BUCKETS" />
                      </div>
                      <Button onClick={handleAddMasterProduct} className="w-full h-16 rounded-2xl bg-zinc-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl">Create Master Entry</Button>
                   </div>
                </DialogContent>
             </Dialog>
          </div>
        </div>
      </div>

      {/* FILTER BAR (STATIC) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 shrink-0">
        {['all', ...categories].map(cat => (
          <Button 
            key={cat}
            variant="ghost" 
            onClick={() => setFilterCategory(cat)}
            className={cn(
              "rounded-xl h-10 px-6 font-black text-[9px] uppercase tracking-widest transition-all",
              filterCategory === cat ? "bg-white shadow-md text-zinc-900 border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* INVENTORY GRID (SCROLLABLE) */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
        
        {/* Main Catalog View */}
        <div className="flex-1 flex flex-col min-h-0">
           <Card className="flex-1 border-none shadow-2xl bg-white/70 backdrop-blur-3xl rounded-[3rem] overflow-hidden border border-white/40 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                   {filteredVariants.map(v => (
                     <div key={v.id} className="relative group">
                        <ProductCard 
                          variant={v as any} 
                          onClick={() => {}} 
                          className="h-full"
                        />
                        <button 
                          onClick={() => handleDeleteVariant(v.id)}
                          className="absolute top-2 right-2 p-3 bg-white/80 backdrop-blur-md rounded-full text-red-500 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                     </div>
                   ))}
                   
                   {/* Quick Add Placeholder */}
                   <Dialog open={!!selectedProductId} onOpenChange={(o) => !o && setSelectedProductId(null)}>
                      <DialogTrigger>
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          className="border-4 border-dashed border-zinc-100 rounded-[2.5rem] flex flex-col items-center justify-center py-20 gap-4 group hover:border-zinc-200 hover:bg-zinc-50/50 transition-all cursor-pointer h-full"
                        >
                           <div className="p-6 bg-zinc-50 rounded-full group-hover:bg-white transition-all shadow-inner"><Plus className="h-10 w-10 text-zinc-200 group-hover:text-zinc-400" /></div>
                           <p className="font-black text-[10px] uppercase tracking-[0.3em] text-zinc-300 group-hover:text-zinc-500">Deploy New Variant</p>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className="rounded-[3rem] bg-white border-none shadow-2xl p-10 max-w-lg overflow-y-auto max-h-[90vh]">
                         <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Inventory Deployment</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-6 py-6 text-left">
                            <div className="space-y-2">
                               <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400 ml-1">Parent Product</Label>
                               <Select onValueChange={(val: string | null) => val && setSelectedProductId(val)}>
                                  <SelectTrigger className="h-14 rounded-2xl font-bold bg-zinc-50 border-zinc-100">
                                     <SelectValue placeholder="Select Master Product..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl bg-white border-zinc-100 shadow-2xl z-[6000]">
                                     {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                  </SelectContent>
                               </Select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400 ml-1">Size / Variant</Label>
                                  <Input value={newSize} onChange={e=>setNewSize(e.target.value)} className="h-14 rounded-2xl bg-zinc-50" placeholder="e.g. 10 Litre" />
                               </div>
                               <div className="space-y-2">
                                  <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400 ml-1">Unit</Label>
                                  <Select value={newUnit} onValueChange={(val: string | null) => val && setNewUnit(val)}>
                                     <SelectTrigger className="h-14 rounded-2xl font-bold bg-zinc-50"><SelectValue /></SelectTrigger>
                                     <SelectContent className="bg-white z-[6000] rounded-xl"><SelectItem value="pcs">PCS</SelectItem><SelectItem value="kg">KG</SelectItem></SelectContent>
                                  </Select>
                               </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                               <div className="space-y-2">
                                  <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400 ml-1">Stock</Label>
                                  <Input type="number" value={newStock} onChange={e=>setNewStock(e.target.value)} className="h-14 rounded-2xl bg-zinc-50" placeholder="0" />
                               </div>
                               <div className="space-y-2">
                                  <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400 ml-1">Retail Price</Label>
                                  <Input type="number" value={newPrice} onChange={e=>setNewPrice(e.target.value)} className="h-14 rounded-2xl bg-zinc-50 font-black text-blue-600" placeholder="0" />
                               </div>
                               <div className="space-y-2">
                                  <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400 ml-1">MSP Limit</Label>
                                  <Input type="number" value={newMsp} onChange={e=>setNewMsp(e.target.value)} className="h-14 rounded-2xl bg-zinc-50 font-black text-red-500" placeholder="0" />
                               </div>
                            </div>

                            <div className="space-y-4">
                               <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400 ml-1">Product Media (One-Touch)</Label>
                               <div className="flex items-center gap-4">
                                  <Button variant="outline" className="flex-1 h-20 rounded-2xl border-dashed border-2 relative group overflow-hidden">
                                     <input 
                                       type="file" 
                                       accept="image/*" 
                                       capture="environment"
                                       className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                       onChange={(e) => setCapturedFile(e.target.files?.[0] || null)}
                                     />
                                     <div className="flex flex-col items-center gap-1">
                                        <Camera className="h-6 w-6 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                                        <span className="text-[8px] font-black uppercase text-zinc-400">Snap or Upload</span>
                                     </div>
                                  </Button>
                                  {capturedFile && (
                                     <div className="h-20 w-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden">
                                        <img src={URL.createObjectURL(capturedFile)} className="w-full h-full object-cover" />
                                     </div>
                                  )}
                               </div>
                            </div>

                            <Button 
                              onClick={handleAddVariant} 
                              disabled={isUploading}
                              className="w-full h-20 rounded-[2rem] bg-zinc-900 text-white font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-zinc-900/40 active:scale-95 transition-all"
                            >
                               {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'AUTHORISE DEPLOYMENT'}
                            </Button>
                         </div>
                      </DialogContent>
                   </Dialog>
                </div>
                
                {filteredVariants.length === 0 && (
                   <div className="py-40 flex flex-col items-center justify-center opacity-20 italic gap-6 text-zinc-400">
                      <div className="p-12 bg-zinc-100 rounded-full"><PackageOpen className="h-24 w-24" /></div>
                      <p className="font-black uppercase tracking-[0.3em]">No items in selected category</p>
                   </div>
                )}
              </ScrollArea>
           </Card>
        </div>

        {/* Intelligence Sidebar (Elite Info) */}
        <div className="hidden lg:flex w-80 flex-col gap-6 shrink-0">
           <Card className="border-none shadow-2xl bg-zinc-900 text-white rounded-[3rem] p-8 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="space-y-1 relative z-10">
                 <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">TOTAL SKU COUNT</p>
                 <h3 className="text-5xl font-black italic tracking-tighter">{variants.length}</h3>
              </div>
              
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Active Stock</span>
                    <span className="font-black text-emerald-400">{variants.reduce((a,b)=>a+b.stock,0)} items</span>
                 </div>
                 <div className="h-[2px] bg-white/5 w-full rounded-full" />
                 <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Low Stock Alerts</p>
                    <div className="space-y-3">
                       {variants.filter(v=>v.stock < 5).slice(0,3).map(v => (
                         <div key={v.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <div className="text-left">
                               <p className="text-[10px] font-black uppercase truncate w-32">{v.size}</p>
                               <p className="text-[8px] font-bold text-red-500 uppercase">{v.stock} LEFT</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              <Button variant="ghost" className="w-full rounded-2xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400 h-12">View Full Analysis</Button>
           </Card>

           <Card className="flex-1 border-none shadow-xl bg-white/50 backdrop-blur-xl rounded-[3rem] p-8 border border-white/40">
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40 italic">
                 <div className="p-6 bg-zinc-50 rounded-full"><Zap className="h-8 w-8 text-zinc-300" /></div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-relaxed">Sync Engine Active<br/>Monitoring local changes</p>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
