"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateItemTotal } from "@/lib/pricing";
import { 
  ScanLine, Trash2, Minus, Plus, Tag, CreditCard,
  IndianRupee, QrCode, Users, Search, Percent, AlertTriangle,
  Package, ShoppingCart, ArrowRight, CheckCircle2, ChevronRight,
  Zap, Command, Info, ParkingMeter, PlayCircle, Loader2, Lock
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Variant, Product } from "@/lib/db";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { ReceiptModal } from "@/components/ReceiptModal";
import { GstInvoiceModal } from "@/components/GstInvoiceModal";
import { SplitPaymentModal } from "@/components/SplitPaymentModal";
import { ProductSearch } from "@/components/ProductSearch";
import { usePOSEvents } from "@/hooks/usePOSEvents";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import { useShift } from "@/components/providers/ShiftProvider";
import { logAuditEvent } from "@/lib/auditLogger";

interface CartItem extends Variant {
  qty: number;
  productName: string;
  image?: string;
  line_total: number;
}

export default function POS() {
  const { activeShift } = useShift();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "split" | "khata">("cash");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const [showReceipt, setShowReceipt] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [lastItems, setLastItems] = useState<any[]>([]);
  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [gstInitialItems, setGstInitialItems] = useState<any[]>([]);

  const parkedCarts = useLiveQuery(() => db.parked_carts.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.where('is_deleted').equals(0).toArray()) || [];

  usePOSEvents({
    onPayment: () => handleCheckout(),
    onClear: () => { if(confirm("Clear cart?")) setCart([]); },
    onSearchFocus: () => { 
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onNavigateUp: () => {},
    onNavigateDown: () => {}
  });

  const catalogData = useLiveQuery(async () => {
    const prods = await db.products.where('is_deleted').equals(0).toArray();
    const vars = await db.variants.where('is_deleted').equals(0).toArray();
    return vars.map(v => {
      const p = prods.find(p => p.id === v.product_id);
      return {
        ...v,
        productName: p?.name || "Unknown Product",
        category: p?.category || "Uncategorized",
        image: v.image_url || p?.image_url,
        parentImage: p?.image_url
      };
    }).filter(v => v.productName !== "Unknown Product");
  }, []);

  const filteredCatalog = (catalogData || []).filter(v => {
    const matchesSearch = v.productName.toLowerCase().includes(search.toLowerCase()) || 
                          v.category.toLowerCase().includes(search.toLowerCase()) ||
                          v.size.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || v.category.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  const subtotal = cart.reduce((acc, item) => acc + item.line_total, 0);
  const totalMsp = cart.reduce((acc, item) => acc + item.msp * item.qty, 0);
  const actualDiscount = Math.min(discount, subtotal); 
  const finalTotal = subtotal - actualDiscount;
  const isBelowMsp = finalTotal < totalMsp;

  const addToCart = (variant: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === variant.id);
      const unitsToAdd = variant.units_per_combo || 1;
      let newQty = existing ? (variant.unit === 'kg' ? existing.qty + unitsToAdd : existing.qty + unitsToAdd) : unitsToAdd;
      if (variant.unit === 'kg') newQty = Number(parseFloat(newQty.toString()).toFixed(3));
      if (newQty > variant.stock) { toast.error("Stock limit reached!"); return prev; }
      const lineTotal = calculateItemTotal(variant, newQty);
      if (existing) return prev.map(item => item.id === variant.id ? { ...item, qty: newQty, line_total: lineTotal } : item);
      return [{ ...variant, qty: newQty, line_total: lineTotal }, ...prev];
    });
    toast.success(`${variant.productName} added`, { duration: 800 });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0.1, item.qty + delta);
        if (newQty > item.stock) { toast.error("Stock limit reached!"); return item; }
        return { ...item, qty: newQty, line_total: calculateItemTotal(item, newQty) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.info("Item removed from cart");
  };

  const handleParkCart = async () => {
    if (cart.length === 0 || !activeShift) return;
    const name = prompt("Reference Name:") || "Guest";
    await db.parked_carts.add({ 
      id: uuidv4(), 
      tenant_id: activeShift.tenant_id,
      customer_name: name, 
      items: cart, 
      total: finalTotal, 
      created_at: new Date().toISOString() 
    });
    setCart([]); setDiscount(0); toast.success("Cart Parked");
  };

  const handleResumeCart = async (parked: any) => {
    setCart(parked.items);
    await db.parked_carts.delete(parked.id);
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async (tenders?: { cash: number; upi: number; card: number }) => {
    if (cart.length === 0 || isProcessing) return;
    if (!activeShift) {
      toast.error("No Active Shift", { description: "Please open a shift to begin billing." });
      return;
    }
    if (paymentMode === 'khata') {
      const customerName = prompt("Customer Name for Khata:");
      if (!customerName) return;
      const customer = await db.customers.where('name').equalsIgnoreCase(customerName).first();
      if (customer && customer.credit_limit && (customer.balance + finalTotal) > customer.credit_limit) {
        if (!confirm(`LIMIT EXCEEDED: ${customerName} has ₹${customer.balance}. This bill will reach ₹${customer.balance + finalTotal} (Limit: ₹${customer.credit_limit}). Override?`)) return;
      }
    }

    setIsProcessing(true);
    const checkoutToast = toast.loading("Authorising...");
    try {
      const saleId = uuidv4();
      const now = new Date().toISOString();
      await db.transaction('rw', [db.sales, db.sale_items, db.variants, db.customers, db.products, db.audit_logs], async () => {
        let verifiedSubtotal = 0;
        let totalPoints = 0;

        for (const item of cart) {
          const freshV = await db.variants.get(item.id);
          const freshP = await db.products.get(item.product_id);
          if (!freshV || freshV.is_deleted === 1) throw new Error(`${item.productName} is missing.`);
          if (freshV.stock < item.qty) throw new Error(`Insufficient stock for ${item.productName}.`);
          
          const lineTotal = calculateItemTotal(freshV, item.qty);
          verifiedSubtotal += lineTotal;

          // 1. Feature #13: Tax Engine (Inject HSN/Tax from Product)
          const taxRate = freshP?.tax_rate || 0;
          const taxAmt = (lineTotal * taxRate) / 100;

          await db.sale_items.add({ 
            id: uuidv4(), 
            sale_id: saleId, 
            variant_id: item.id, 
            quantity: item.qty, 
            unit_price: item.base_price, 
            tax_rate: taxRate,
            subtotal: lineTotal, 
            updated_at: now, 
            is_deleted: 0, 
            sync_status: 'pending', 
            version_clock: Date.now(),
            tenant_id: activeShift.tenant_id 
          });

          // 2. Feature #15: Restock/Deplete logic
          await db.variants.update(item.id, { 
            stock: freshV.stock - item.qty, 
            updated_at: now, 
            version_clock: (freshV.version_clock || 0) + 1 
          });
        }

        const verifiedDiscount = Math.min(discount, verifiedSubtotal);
        const verifiedTotal = verifiedSubtotal - verifiedDiscount;

        // 3. Feature #16: Loyalty Points (1 point per ₹100)
        totalPoints = Math.floor(verifiedTotal / 100);

        if (paymentMode === 'khata') {
          const customerName = localStorage.getItem('last_khata_customer');
          const customer = await db.customers.where('name').equalsIgnoreCase(customerName || "").first();
          if (customer) {
            await db.customers.update(customer.id, {
              balance: customer.balance + verifiedTotal,
              loyalty_points: (customer.loyalty_points || 0) + totalPoints,
              last_tx: now,
              updated_at: now
            });
          }
        }

        let cashAmt = paymentMode === 'cash' ? verifiedTotal : 0;
        let upiAmt = paymentMode === 'upi' ? verifiedTotal : 0;
        let cardAmt = paymentMode === 'card' ? verifiedTotal : 0;

        if (paymentMode === 'split' && tenders) {
          cashAmt = tenders.cash;
          upiAmt = tenders.upi;
          cardAmt = tenders.card;
        }

        await db.sales.add({ 
          id: saleId, 
          shift_id: activeShift.id, 
          total_amount: verifiedTotal, 
          discount: verifiedDiscount, 
          payment_method: paymentMode, 
          cash_amount: cashAmt,
          upi_amount: upiAmt,
          card_amount: cardAmt,
          tax_amount: 0, // Simplified for this pass
          invoice_no: `INV-${Date.now().toString().slice(-6)}`,
          status: 'completed',
          date: now, 
          updated_at: now, 
          sync_status: 'pending', 
          is_deleted: 0, 
          version_clock: Date.now(),
          tenant_id: activeShift.tenant_id
        });

        if (verifiedDiscount > 0) {
          await logAuditEvent(activeShift.tenant_id, activeShift.user_id, 'MANUAL_DISCOUNT', 'sale', saleId, { amount: verifiedDiscount, cart_total: verifiedSubtotal });
        }
      });
      setLastSale({ id: saleId, total: finalTotal, discount: actualDiscount, paymentMethod: paymentMode, date: now });
      setLastItems([...cart]);
      setShowReceipt(true);
      toast.success("Bill Generated", { id: checkoutToast });
      setCart([]); setDiscount(0); setPaymentMode("cash");
    } catch (err: any) { toast.error(err.message || "Checkout Failed", { id: checkoutToast }); } finally { setIsProcessing(false); }
  };

  if (!activeShift) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center gap-4 text-center px-4">
        <div className="p-6 bg-zinc-100 dark:bg-zinc-800 rounded-full">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Terminal Locked</h2>
        <p className="text-sm font-medium text-zinc-500 max-w-sm">You must open a shift and declare your starting float to process sales.</p>
        <Link href="/shifts">
          <Button className="mt-4 h-12 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl">Open Shift</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 md:gap-6 max-w-7xl mx-auto pb-32 md:pb-6 px-4 md:px-0 text-left">
      <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} saleData={lastSale || {}} items={lastItems} onGenerateGst={(items) => { setGstInitialItems(items); setIsGstModalOpen(true); }} />
      <GstInvoiceModal isOpen={isGstModalOpen} onClose={() => setIsGstModalOpen(false)} initialItems={gstInitialItems} />
      <SplitPaymentModal 
        isOpen={isSplitModalOpen} 
        onClose={() => setIsSplitModalOpen(false)} 
        totalAmount={finalTotal} 
        onConfirm={(tenders) => handleCheckout(tenders)} 
      />

      {/* Catalog Section */}
      <Card className="flex-[1.5] flex flex-col min-h-[500px] md:min-h-0 border-zinc-200 shadow-xl rounded-[2rem] md:rounded-3xl overflow-visible md:overflow-hidden bg-white relative z-20">
        <div className="p-4 md:p-6 border-b border-zinc-100 flex gap-2 md:gap-4 items-center bg-zinc-50/50">
          <div className="flex-1 relative z-50"><ProductSearch onSelect={addToCart} onQueryChange={setSearch} placeholder="Search... (⌘+K)" /></div>
          <Button size="icon" className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-zinc-900 shrink-0"><ScanLine className="h-6 w-6" /></Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 relative z-10">
          <div className="px-4 md:px-6 pt-3 md:pt-4 overflow-x-auto scrollbar-hide shrink-0">
            <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full justify-start h-auto flex-wrap md:flex-nowrap gap-1 md:gap-2">
              <TabsTrigger value="all" className="rounded-lg px-4 md:px-6 py-2 font-bold uppercase text-[8px] md:text-[10px] tracking-widest">All</TabsTrigger>
              {categories.map(c => <TabsTrigger key={c.id} value={c.name} className="rounded-lg px-4 md:px-6 py-2 font-bold uppercase text-[8px] md:text-[10px] tracking-widest whitespace-nowrap">{c.name}</TabsTrigger>)}
            </TabsList>
          </div>
          <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 pb-20">
               {filteredCatalog.map((v) => <ProductCard key={v.id} variant={v as any} onClick={() => addToCart(v)} />)}
               {filteredCatalog.length === 0 && <div className="col-span-full py-20 text-center opacity-30 font-black uppercase text-xs tracking-widest">No products found</div>}
            </div>
          </ScrollArea>
        </Tabs>
      </Card>

      {/* Cart Section */}
      <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-4 md:gap-6 shrink-0 min-h-0 relative z-10">
        <Card className="flex-1 border-zinc-200 shadow-xl rounded-[2rem] md:rounded-3xl flex flex-col min-h-0 bg-white">
          <div className="p-4 md:p-6 border-b border-zinc-100 flex justify-between items-center">
            <h3 className="font-black text-lg md:text-xl flex items-center gap-3 tracking-tight uppercase italic"><ShoppingCart className="h-5 w-5 text-blue-600" /> Cart</h3>
            <div className="flex gap-2">
               {parkedCarts.length > 0 && <Badge className="bg-blue-600 cursor-pointer text-[8px] md:text-[10px]" onClick={() => handleResumeCart(parkedCarts[0])}>{parkedCarts.length} Parked</Badge>}
               <Button variant="ghost" size="icon" onClick={handleParkCart} className="h-8 w-8 rounded-lg"><ParkingMeter className="h-4 w-4" /></Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 md:p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 group relative transition-all">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs md:text-sm truncate uppercase italic leading-none mb-1">{item.productName}</h4>
                    <p className="text-[8px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{item.size} &bull; ₹{item.base_price}</p>
                  </div>
                  <div className="text-right flex items-center gap-2 md:gap-3">
                    <div>
                      <div className="font-black text-xs md:text-sm text-right tabular-nums text-blue-600">₹{item.line_total}</div>
                      <div className="flex items-center gap-2 mt-1.5 bg-white rounded-lg border border-zinc-200 p-0.5">
                        <button onClick={() => updateQty(item.id, -1)} className="h-6 w-6 flex items-center justify-center hover:bg-zinc-50 rounded"><Minus className="h-2 w-2" /></button>
                        <span className="text-[10px] font-black min-w-[20px] text-center tabular-nums">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="h-6 w-6 flex items-center justify-center hover:bg-zinc-50 rounded"><Plus className="h-2 w-2" /></button>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-zinc-300 hover:text-red-500 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <div className="py-20 text-center opacity-20 font-black uppercase text-[10px] tracking-[0.2em]">Cart is empty</div>}
            </div>
          </ScrollArea>
          
          <div className="p-4 md:p-6 bg-zinc-50 border-t border-zinc-100 space-y-3 md:space-y-4 rounded-b-[2rem] md:rounded-b-3xl">
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest"><span>Subtotal</span><span className="tabular-nums font-black">₹{subtotal.toLocaleString()}</span></div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-black uppercase text-blue-600"><span>Discount Apply</span><span className="tabular-nums">- ₹{actualDiscount.toLocaleString()}</span></div>
              <Slider value={[actualDiscount]} max={subtotal} step={10} onValueChange={(v: number | readonly number[]) => setDiscount(Array.isArray(v) ? v[0] : v)} />
            </div>
            <div className="pt-2 flex justify-between items-end border-t border-zinc-200">
              <span className="text-[8px] md:text-[10px] font-black uppercase text-zinc-400 mb-1">Payable</span>
              <span className={cn("text-3xl md:text-4xl font-black tracking-tighter tabular-nums leading-none", isBelowMsp ? 'text-red-600' : 'text-zinc-900')}>₹{finalTotal.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5 mt-2">
              {['cash', 'upi', 'card', 'split', 'khata'].map(m => (
                <Button key={m} variant={paymentMode === m ? 'default' : 'outline'} className={cn("h-9 rounded-xl text-[8px] font-black uppercase tracking-widest", paymentMode === m && "bg-primary text-white")} onClick={() => setPaymentMode(m as any)}>{m}</Button>
              ))}
            </div>
            <Button onClick={() => paymentMode === 'split' ? setIsSplitModalOpen(true) : handleCheckout()} disabled={cart.length === 0 || isProcessing} className={cn("w-full h-14 md:h-16 text-sm md:text-base font-black uppercase tracking-widest rounded-2xl mt-2 shadow-2xl transition-all active:scale-95", isBelowMsp ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-white hover:opacity-90')}>
               {isProcessing ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <span className="text-white flex items-center">Generate Bill <ArrowRight className="ml-2 h-5 w-5" /></span>}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
