"use client";

import { motion } from "framer-motion";
import { 
  IndianRupee, TrendingUp, Package, AlertTriangle,
  QrCode, ShoppingCart, Banknote, MessageCircle, Truck, 
  History as HistoryIcon, Zap, LayoutDashboard,
  ShieldCheck, ArrowRight, User, MousePointer2,
  Clock, CheckCircle2, ChevronRight, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 100 } }
};

export default function Dashboard() {
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsTimedOut(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const sales = useLiveQuery(() => db.sales.where('is_deleted').equals(0).toArray(), []);
  const saleItems = useLiveQuery(() => db.sale_items.where('is_deleted').equals(0).toArray(), []);
  const variants = useLiveQuery(() => db.variants.where('is_deleted').equals(0).toArray(), []);
  const products = useLiveQuery(() => db.products.where('is_deleted').equals(0).toArray(), []);
  const customers = useLiveQuery(() => db.customers.where('is_deleted').equals(0).toArray(), []);
  const parkedCarts = useLiveQuery(() => db.parked_carts.toArray()) || [];

  const isDataLoading = !isTimedOut && (sales === undefined || saleItems === undefined || variants === undefined || products === undefined || customers === undefined);

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-8">
        <div className="relative">
           <div className="absolute inset-0 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse" />
           <div className="h-24 w-24 rounded-full border-4 border-zinc-100 border-t-zinc-900 animate-spin relative z-10" />
        </div>
        <div className="text-zinc-900 font-black uppercase tracking-[0.4em] text-xs">
          Authenticating Enterprise Terminal...
        </div>
      </div>
    );
  }

  const allSales = sales || [];
  const allSaleItems = saleItems || [];
  const allVariants = variants || [];
  const allProducts = products || [];
  const allCustomers = customers || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysSales = allSales.filter(s => s.date.startsWith(todayStr));
  
  const todayRevenue = todaysSales.reduce((acc, sale) => acc + sale.total_amount, 0);
  const itemsSoldToday = allSaleItems.filter(si => todaysSales.find(s => s.id === si.sale_id))
                                  .reduce((acc, curr) => acc + curr.quantity, 0);
  
  const pendingKhata = allCustomers.reduce((acc, curr) => acc + curr.balance, 0);
  const khataFollowups = allCustomers.filter(c => c.status === "Overdue" && c.balance > 0);

  const todayCash = todaysSales.filter(s => s.payment_method === 'cash').reduce((acc, s) => acc + s.total_amount, 0);
  const todayUpi = todaysSales.filter(s => s.payment_method === 'upi').reduce((acc, s) => acc + s.total_amount, 0);
  const todaySplit = todaysSales.filter(s => s.payment_method === 'split').reduce((acc, s) => acc + s.total_amount, 0); 
  
  const totalReceived = todayCash + todayUpi + todaySplit;
  const cashPercentage = totalReceived > 0 ? Math.round(((todayCash + todaySplit/2) / totalReceived) * 100) : 0;
  const upiPercentage = totalReceived > 0 ? 100 - cashPercentage : 0;

  const lowStock = allVariants.filter(v => v.stock < 10).map(v => {
    const p = allProducts.find(p => p.id === v.product_id);
    return {
      id: v.id,
      name: p?.name || "Unknown",
      size: v.size,
      stock: v.stock,
      unit: v.unit || 'pcs',
      status: v.stock < 5 ? "Critical" : "Low"
    };
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-8 max-w-[1600px] mx-auto overflow-hidden px-4 md:px-6">
      
      {/* ELITE DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 py-2">
        <div className="flex items-center gap-6">
          <motion.div 
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            className="h-24 w-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl shrink-0 p-1 bg-zinc-50"
          >
            <img src="/joyramlogo.png" alt="Logo" className="w-full h-full object-cover rounded-[1.5rem]" />
          </motion.div>
          <div className="text-left">
            <h2 className="text-5xl font-black tracking-tighter text-zinc-900 italic uppercase">System Console</h2>
            <div className="flex items-center gap-3 mt-2">
               <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black tracking-widest uppercase px-3 py-1 rounded-lg">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-2 inline-block" />
                 Active Connection
               </Badge>
               <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest opacity-60">JRS TERMINAL ID: 09-DEV</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Link href="/pos">
            <Button size="lg" className="bg-zinc-900 hover:bg-black text-white shadow-2xl shadow-zinc-900/40 rounded-[1.75rem] h-16 px-10 font-black transition-all active:scale-95 text-xs tracking-widest uppercase group">
              <ShoppingCart className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Launch POS
            </Button>
          </Link>
          <Link href="/history">
            <Button size="lg" variant="outline" className="bg-white border-2 border-zinc-900 hover:bg-zinc-50 text-zinc-900 shadow-xl rounded-[1.75rem] h-16 px-10 font-black transition-all active:scale-95 text-xs tracking-widest uppercase">
              <HistoryIcon className="mr-3 h-5 w-5" />
              Archives
            </Button>
          </Link>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="space-y-8 pb-10">
          
          {/* HOLOGRAPHIC STATS GRID */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-4"
          >
            {[
              { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString()}`, icon: IndianRupee, color: "blue", sub: "Live Sales Flow" },
              { label: "Volume Sold", value: `${itemsSoldToday} Units`, icon: Package, color: "zinc", sub: "Inventory Delta" },
              { label: "Market Debt", value: `₹${pendingKhata.toLocaleString()}`, icon: AlertTriangle, color: "amber", sub: `${khataFollowups.length} Overdue` },
              { label: "Parked Carts", value: parkedCarts.length, icon: MousePointer2, color: "zinc", sub: "Waiting Orders" }
            ].map((stat, i) => (
              <motion.div key={i} variants={item}>
                <Card className="border-none shadow-2xl shadow-zinc-200/50 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group hover:shadow-zinc-300 transition-all border border-white/40">
                  <CardContent className="p-8 relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                       <stat.icon className="h-16 w-16 text-zinc-900" />
                    </div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                    <h3 className="text-4xl font-black text-zinc-900 tracking-tighter italic mb-4">{stat.value}</h3>
                    <Badge variant="outline" className="bg-zinc-50 border-zinc-100 text-zinc-500 font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg">
                      {stat.sub}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-12">
            
            {/* LEFT COLUMN: EOD & RECENT */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* EOD Reconciliation */}
              <Card className="border-none shadow-2xl shadow-zinc-200/50 bg-white/70 backdrop-blur-3xl rounded-[3rem] overflow-hidden border border-white/40">
                <CardHeader className="p-10 pb-6 border-b border-zinc-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-3xl font-black flex items-center gap-4 italic uppercase tracking-tighter text-zinc-900">
                         <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-600/20"><Activity className="h-6 w-6" /></div> 
                         Cash-Flow Ledger
                      </CardTitle>
                      <CardDescription className="text-sm font-bold uppercase tracking-widest text-zinc-400">Till reconciliation and digital verification</CardDescription>
                    </div>
                    <Badge className="bg-zinc-900 text-white font-black px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest shadow-xl">Verified Secure</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <div className="flex justify-between items-end">
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><QrCode className="h-4 w-4 text-purple-600" /> Digital UPI</span>
                             <span className="text-xl font-black italic tracking-tighter text-zinc-900">₹{Math.round(totalReceived * (upiPercentage/100)).toLocaleString()}</span>
                          </div>
                          <Progress value={upiPercentage} className="h-3 bg-zinc-100 rounded-full" />
                       </div>
                       <div className="space-y-4">
                          <div className="flex justify-between items-end">
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Banknote className="h-4 w-4 text-emerald-600" /> Physical Cash</span>
                             <span className="text-xl font-black italic tracking-tighter text-zinc-900">₹{Math.round(totalReceived * (cashPercentage/100)).toLocaleString()}</span>
                          </div>
                          <Progress value={cashPercentage} className="h-3 bg-zinc-100 rounded-full" />
                       </div>
                    </div>
                    
                    <div className="bg-zinc-900 text-white rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                       <div className="relative z-10">
                          <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[9px]">DRAWER PAYABLE</p>
                          <h4 className="text-4xl font-black tracking-tighter italic mt-2 text-emerald-400">₹{Math.round(totalReceived * (cashPercentage/100)).toLocaleString()}</h4>
                       </div>
                       <Button className="w-full h-14 bg-white text-zinc-900 hover:bg-zinc-100 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-xl mt-8 active:scale-95 transition-all">Close Till & Settle</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transaction Feed */}
              <Card className="border-none shadow-2xl shadow-zinc-200/50 bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/40">
                <CardHeader className="p-10 pb-6 border-b border-zinc-50">
                  <CardTitle className="text-3xl font-black flex items-center gap-4 italic uppercase tracking-tighter text-zinc-900">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/20"><HistoryIcon className="h-6 w-6" /></div> Live Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-zinc-50/50">
                         <TableRow className="border-none h-14 hover:bg-transparent">
                            <TableHead className="pl-10 font-black uppercase text-[9px] tracking-widest text-zinc-400">Product Entry</TableHead>
                            <TableHead className="font-black uppercase text-[9px] tracking-widest text-zinc-400">Quantity Delta</TableHead>
                            <TableHead className="text-right pr-10 font-black uppercase text-[9px] tracking-widest text-zinc-400">Time-Log</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSaleItems.slice().reverse().slice(0, 5).map((si, idx) => {
                          const v = allVariants.find(v => v.id === si.variant_id);
                          const p = allProducts.find(p => p.id === v?.product_id);
                          const s = allSales.find(s => s.id === si.sale_id);
                          return (
                            <TableRow key={si.id} className="hover:bg-zinc-50 border-none group transition-all">
                              <TableCell className="pl-10 py-6">
                                 <div className="font-black text-zinc-900 uppercase italic tracking-tight text-base group-hover:text-blue-600 transition-colors">{p?.name || "Unknown"}</div>
                                 <div className="text-[9px] font-black text-zinc-400 mt-1 uppercase tracking-widest">{v?.size || "MASTER ENTRY"}</div>
                              </TableCell>
                              <TableCell className="py-6">
                                 <Badge className="bg-zinc-900 text-white font-black text-[10px] px-3 py-1 rounded-lg shadow-lg">-{si.quantity} {v?.unit?.toUpperCase() || 'PCS'}</Badge>
                              </TableCell>
                              <TableCell className="text-right pr-10 py-6">
                                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-end gap-2">
                                    <Clock className="h-3 w-3" /> {s ? new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "N/A"}
                                 </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                   </Table>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: ALERTS & KHATA */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Low Stock Radar */}
              <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/40 flex flex-col">
                <CardHeader className="p-8 pb-4">
                   <div className="flex justify-between items-center">
                     <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900 flex items-center gap-3">
                       <Zap className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" /> Radar
                     </CardTitle>
                     <Badge className="bg-red-500 text-white font-black px-3 py-1 rounded-lg text-[8px] uppercase tracking-widest">{lowStock.length} ALERTS</Badge>
                   </div>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                   {lowStock.slice(0,4).map(item => (
                     <div key={item.id} className="p-5 rounded-[1.75rem] bg-zinc-50 border border-zinc-100 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                        <div className="text-left">
                           <h5 className="font-black text-zinc-900 text-[11px] uppercase italic leading-none">{item.name}</h5>
                           <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1.5">{item.size}</p>
                        </div>
                        <div className="text-right">
                           <p className={cn("font-black text-xl tracking-tighter", item.status === 'Critical' ? 'text-red-500' : 'text-amber-500')}>
                              {item.stock} <small className="text-[10px] uppercase opacity-50">LEFT</small>
                           </p>
                        </div>
                     </div>
                   ))}
                   <Link href="/inventory" className="block pt-2">
                      <Button variant="ghost" className="w-full text-zinc-400 hover:text-zinc-900 font-black uppercase text-[9px] tracking-widest h-12 rounded-xl group">
                         Replenish Inventory <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                   </Link>
                </CardContent>
              </Card>

              {/* Khata High-Alerts */}
              <Card className="border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] bg-zinc-900 text-white rounded-[3.5rem] flex-1 flex flex-col relative overflow-hidden min-h-[500px]">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                 <CardHeader className="p-10 pb-6 relative z-10">
                    <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4 leading-none">
                       <div className="p-3 bg-white/10 rounded-2xl border border-white/5"><User className="h-7 w-7 text-blue-400" /></div> 
                       High Risk Khata
                    </CardTitle>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Overdue debt monitoring</p>
                 </CardHeader>
                 <CardContent className="p-10 pt-0 relative z-10 flex-1 flex flex-col">
                    <div className="space-y-6 flex-1">
                       {khataFollowups.slice(0,3).map(customer => (
                         <div key={customer.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-xl group hover:bg-white/10 transition-all shadow-2xl text-left">
                            <div className="flex justify-between items-start mb-4">
                               <div>
                                  <h4 className="font-black text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors uppercase italic truncate w-40 leading-none">{customer.name}</h4>
                                  <p className="text-zinc-500 font-black text-[8px] mt-2 uppercase tracking-widest">{customer.phone}</p>
                               </div>
                               <Badge className="bg-red-500/20 text-red-400 border-none text-[9px] font-black italic tracking-tighter">₹{customer.balance.toLocaleString()}</Badge>
                            </div>
                            <Button className="w-full bg-white text-zinc-900 hover:bg-blue-400 hover:text-white font-black rounded-2xl h-12 shadow-2xl active:scale-95 transition-all text-[9px] tracking-widest uppercase">
                               <MessageCircle className="mr-2 h-4 w-4" /> Trigger WhatsApp
                            </Button>
                         </div>
                       ))}
                    </div>
                    <Link href="/khata" className="mt-8">
                       <Button variant="ghost" className="w-full text-zinc-500 hover:text-white font-black uppercase text-[10px] tracking-widest h-14 group">
                          Master Ledger View <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                       </Button>
                    </Link>
                 </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
