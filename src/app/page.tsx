"use client";

import { motion } from "framer-motion";
import { 
  IndianRupee, Package, 
  ShoppingCartIcon, Zap, ArrowRight,
  TrendingUp, Activity, Receipt
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTenant } from "@/components/providers/TenantProvider";
import { RoleGate } from "@/components/ui/RoleGate";
import { format, subDays, parseISO } from "date-fns";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  const { tenant } = useTenant();
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsTimedOut(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const sales = useLiveQuery(() => db.sales.where('is_deleted').equals(0).toArray(), []);
  const saleItems = useLiveQuery(() => db.sale_items.where('is_deleted').equals(0).toArray(), []);
  const variants = useLiveQuery(() => db.variants.where('is_deleted').equals(0).toArray(), []);
  const products = useLiveQuery(() => db.products.where('is_deleted').equals(0).toArray(), []);
  const expenses = useLiveQuery(() => db.expenses.where('is_deleted').equals(0).toArray(), []);

  const isDataLoading = !isTimedOut && (!sales || !saleItems || !variants || !products || !expenses);

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <Activity className="h-8 w-8 text-primary animate-pulse" />
        <div className="text-zinc-400 font-black uppercase tracking-[0.3em] animate-pulse text-xs">Loading Analytics Engine...</div>
      </div>
    );
  }

  const allSales = sales || [];
  const allVariants = variants || [];
  const allProducts = products || [];

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysSales = allSales.filter(s => s.date.startsWith(todayStr) && s.status !== 'void');
  const todayRevenue = todaysSales.reduce((acc, sale) => acc + sale.total_amount, 0);

  const todaysExpenses = (expenses || []).filter(e => e.date.startsWith(todayStr));
  const todayExpenseTotal = todaysExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  const lowStock = allVariants.filter(v => v.stock <= (v.low_stock_threshold || 5)).map(v => {
    const p = allProducts.find(p => p.id === v.product_id);
    return { ...v, productName: p?.name || "Unknown" };
  }).sort((a, b) => a.stock - b.stock);

  // Generate 7-Day Revenue Chart Data
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const daySales = allSales.filter(s => s.date.startsWith(dateStr) && s.status !== 'void');
    return {
      name: format(d, 'EEE'), // Mon, Tue
      revenue: daySales.reduce((acc, s) => acc + s.total_amount, 0)
    };
  });

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-24 md:pb-20 text-left px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl overflow-hidden border-2 border-white dark:border-zinc-800 shadow-xl shrink-0 p-1 bg-white dark:bg-zinc-900 ring-2 ring-primary/10">
            <img src={tenant?.logo_url || "/joyramlogo.png"} alt="Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic leading-none">{tenant?.business_name || "System Console"}</h2>
            <p className="text-primary font-bold uppercase tracking-widest text-[8px] md:text-[10px] mt-1">Live Analytics Terminal</p>
          </div>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Link href="/pos" className="flex-1 md:flex-none"><Button className="w-full bg-primary text-primary-foreground hover:opacity-90 h-12 md:h-14 rounded-xl font-black uppercase text-[10px] tracking-widest px-6 md:px-8 shadow-xl shadow-primary/20">Launch POS</Button></Link>
          <Link href="/history" className="flex-1 md:flex-none"><Button variant="outline" className="w-full h-12 md:h-14 rounded-xl font-black uppercase text-[10px] tracking-widest px-6 md:px-8 border-zinc-200 dark:border-zinc-800 dark:text-white">Archives</Button></Link>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <RoleGate allowedRoles={['admin', 'manager']}>
          <motion.div variants={item}>
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-lg rounded-2xl md:rounded-3xl overflow-hidden bg-white dark:bg-zinc-900/50 backdrop-blur-xl hover:shadow-xl transition-all">
              <CardContent className="p-4 md:p-6 flex justify-between items-center">
                <div className="text-left overflow-hidden">
                  <p className="text-[7px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 truncate">Today's Revenue</p>
                  <h3 className="text-xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic tabular-nums">₹{todayRevenue.toLocaleString()}</h3>
                </div>
                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-inner shrink-0 ml-2 bg-primary/5 border-primary/10`}>
                  <IndianRupee className={cn("h-4 w-4 md:h-6 md:w-6 text-primary")} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </RoleGate>

        <motion.div variants={item}>
          <Card className="border-zinc-100 dark:border-zinc-800 shadow-lg rounded-2xl md:rounded-3xl overflow-hidden bg-white dark:bg-zinc-900/50 backdrop-blur-xl hover:shadow-xl transition-all">
            <CardContent className="p-4 md:p-6 flex justify-between items-center">
              <div className="text-left overflow-hidden">
                <p className="text-[7px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 truncate">Petty Cash Out</p>
                <h3 className="text-xl md:text-3xl font-black text-red-500 tracking-tighter italic tabular-nums">₹{todayExpenseTotal.toLocaleString()}</h3>
              </div>
              <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-inner shrink-0 ml-2 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30`}>
                <Receipt className={cn("h-4 w-4 md:h-6 md:w-6 text-red-500")} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {[
          { label: "Low Stock Alerts", val: lowStock.length, icon: Zap, color: "text-red-500" },
          { label: "Today's Invoices", val: todaysSales.length, icon: ShoppingCartIcon, color: "text-emerald-500" },
          { label: "Active Products", val: allVariants.length, icon: Package, color: "text-zinc-900 dark:text-white" }
        ].map((s, i) => (
          <motion.div key={i} variants={item}>
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-lg rounded-2xl md:rounded-3xl overflow-hidden bg-white dark:bg-zinc-900/50 backdrop-blur-xl hover:shadow-xl transition-all">
              <CardContent className="p-4 md:p-6 flex justify-between items-center">
                <div className="text-left overflow-hidden">
                  <p className="text-[7px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 truncate">{s.label}</p>
                  <h3 className="text-xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic tabular-nums">{s.val}</h3>
                </div>
                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-inner shrink-0 ml-2 bg-primary/5 border-primary/10`}>
                  <s.icon className={cn("h-4 w-4 md:h-6 md:w-6", s.color)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-12">
        {/* Module: Revenue Analytics */}
        <RoleGate allowedRoles={['admin', 'manager']}>
          <div className="md:col-span-8 space-y-6">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-zinc-900/50 backdrop-blur-xl h-full flex flex-col overflow-hidden text-left">
             <CardHeader className="p-6 md:p-8 pb-2 border-b border-zinc-50 dark:border-zinc-800 flex flex-row items-center justify-between">
                <CardTitle className="text-xs md:text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 italic text-zinc-900 dark:text-white">
                   <TrendingUp className="h-4 w-4 text-primary" /> 7-Day Revenue Trend
                </CardTitle>
                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest bg-primary/5 text-primary border-primary/20">Live Sync</Badge>
             </CardHeader>
             <CardContent className="p-4 md:p-6 flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10 dark:opacity-20" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#888' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#888' }}
                      tickFormatter={(value: any) => `₹${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="var(--brand-primary)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </CardContent>
          </Card>
        </div>
        </RoleGate>

        {/* Module: Low Stock Alerts */}
        <div className="md:col-span-4 space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-zinc-900/50 backdrop-blur-xl h-full flex flex-col overflow-hidden">
             <CardHeader className="p-6 md:p-8 pb-4 border-b border-zinc-50 dark:border-zinc-800">
                <CardTitle className="text-xs md:text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 italic dark:text-white">
                   <Zap className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" /> Critical Stock Alerts
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[250px] md:h-[300px]">
                   <div className="p-4 space-y-2 md:space-y-3">
                      {lowStock.length === 0 ? (
                        <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase dark:text-white">All Stock Healthy</div>
                      ) : lowStock.map(v => (
                        <div key={v.id} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group transition-all">
                           <div className="text-left overflow-hidden mr-2">
                              <p className="font-black text-[10px] md:text-xs uppercase italic truncate dark:text-white">{v.productName}</p>
                              <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase mt-0.5">{v.size}</p>
                           </div>
                           <Badge className={cn("rounded-lg font-black text-[8px] md:text-[10px] shrink-0", v.stock <= 0 ? "bg-red-600" : "bg-orange-500")}>{v.stock} LEFT</Badge>
                        </div>
                      ))}
                   </div>
                </ScrollArea>
             </CardContent>
             <Link href="/inventory" className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Button variant="ghost" className="w-full text-[8px] md:text-[9px] font-black uppercase tracking-widest gap-2 text-primary">Manage Inventory <ArrowRight className="h-3 w-3" /></Button>
             </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
