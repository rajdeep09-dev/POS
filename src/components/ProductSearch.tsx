"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Package, Command, X, ArrowRight, Zap, History, TrendingUp, Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { fuzzyMatch, getLevenshteinDistance } from "@/lib/fuzzy";

interface ProductSearchProps {
  onSelect: (item: any) => void;
  onQueryChange?: (query: string) => void;
  className?: string;
  placeholder?: string;
}

export function ProductSearch({ onSelect, onQueryChange, className, placeholder = "Scan Barcode or Search..." }: ProductSearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with parent query
  const handleSearchChange = (val: string) => {
    setSearch(val);
    onQueryChange?.(val);
  };

  // Global focus shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const catalog = useLiveQuery(async () => {
    const products = await db.products.where('is_deleted').equals(0).toArray();
    const variants = await db.variants.where('is_deleted').equals(0).toArray();
    
    return variants.map(v => {
      const p = products.find(prod => prod.id === v.product_id);
      return {
        ...v,
        productName: p?.name || "Unknown Product",
        category: p?.category || "General",
        image: v.image_url || p?.image_url
      };
    });
  }, []);

  /**
   * PERFECT RANKING ENGINE
   * 1. Exact Name/Barcode matches (Top)
   * 2. 'Starts With' matches
   * 3. 'Includes' matches
   * 4. Fuzzy / Typo-tolerant matches (Bottom)
   */
  const filtered = useMemo(() => {
    if (!search || !catalog) return [];
    const q = search.toLowerCase();

    return catalog
      .map(item => {
        const name = item.productName.toLowerCase();
        const barcode = item.barcode?.toLowerCase() || "";
        
        let score = 0;
        if (name === q || barcode === q) score = 100;
        else if (name.startsWith(q)) score = 80;
        else if (name.includes(q)) score = 60;
        else if (fuzzyMatch(q, item.productName, 1)) score = 40;
        else if (fuzzyMatch(q, item.productName, 2)) score = 20;

        return { ...item, searchScore: score };
      })
      .filter(item => item.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, 8);
  }, [search, catalog]);

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      onSelect(filtered[selectedIndex]);
      handleSearchChange("");
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* PERFECT INPUT UI */}
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10 pointer-events-none">
          <motion.div
            animate={isOpen ? { rotate: 90, scale: 1.1 } : { rotate: 0, scale: 1 }}
            className={cn("transition-colors duration-500", isOpen ? "text-blue-600" : "text-zinc-400")}
          >
            <Search className="h-6 w-6" />
          </motion.div>
          <div className={cn("h-4 w-[2px] rounded-full transition-all duration-500", isOpen ? "bg-blue-600 scale-y-125" : "bg-zinc-200")} />
        </div>
        
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className={cn(
            "pl-16 pr-32 h-20 rounded-[2rem] bg-white border-2 border-zinc-100 transition-all duration-500",
            "text-xl font-black italic tracking-tight placeholder:text-zinc-300 placeholder:italic",
            "focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-blue-600 focus:shadow-[0_20px_80px_rgba(37,99,235,0.15)]",
            isOpen && "rounded-b-none border-b-zinc-50 shadow-none"
          )}
          value={search}
          onChange={(e) => {
            handleSearchChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
          <AnimatePresence mode="wait">
            {search ? (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => { handleSearchChange(""); setIsOpen(false); }}
                className="p-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-colors"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </motion.button>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="flex flex-col items-end shrink-0 hidden sm:flex">
                   <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none">Auto-Scan</span>
                   <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Ready</span>
                </div>
                <div className="h-10 w-10 bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-100 relative overflow-hidden">
                   <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                   <Barcode className="h-5 w-5 text-zinc-400 relative z-10" />
                </div>
                <kbd className="hidden md:flex h-8 select-none items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 font-mono text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <span className="text-xs">⌘</span> K
                </kbd>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DROPDOWN / DRAWER ENGINE */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-zinc-950/20 backdrop-blur-[2px] z-[900] md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className={cn(
                "z-[1000] flex flex-col overflow-hidden transition-all duration-500",
                "fixed inset-x-0 bottom-0 top-auto h-[80vh] bg-white rounded-t-[3.5rem] shadow-[0_-40px_100px_rgba(0,0,0,0.2)] md:h-auto",
                "md:absolute md:top-full md:inset-x-0 md:bottom-auto md:bg-white md:border-2 md:border-blue-600 md:border-t-0 md:rounded-b-[2.5rem] md:rounded-t-none md:shadow-2xl"
              )}
            >
              <div className="md:hidden w-16 h-1.5 bg-zinc-100 rounded-full mx-auto my-6 shrink-0" />
              
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="px-10 py-4 bg-zinc-50/50 flex items-center justify-between">
                   <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                     <Zap className="h-4 w-4 text-amber-500 fill-amber-500" /> 
                     {search ? "Relevance Ranking" : "Recent Inventory"}
                   </div>
                   <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                     {filtered.length} Matches Found
                   </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 md:p-5">
                    {!search ? (
                       <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-40 italic">
                          <div className="p-8 bg-zinc-50 rounded-full"><Search className="h-12 w-12 text-zinc-300" /></div>
                          <p className="font-black text-sm uppercase tracking-[0.3em] text-zinc-400">Waiting for input...</p>
                       </div>
                    ) : filtered.length === 0 ? (
                      <div className="p-16 text-center flex flex-col items-center gap-6">
                        <div className="p-8 bg-red-50 rounded-full">
                          <Package className="h-12 w-12 text-red-200" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-zinc-900 font-black italic text-xl tracking-tight uppercase">No results for "{search}"</p>
                          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Try searching by category or barcode</p>
                        </div>
                        <button 
                          onClick={() => handleSearchChange("")}
                          className="px-8 py-3 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                        >
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 pb-6">
                        {filtered.map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => {
                              onSelect(item);
                              handleSearchChange("");
                              setIsOpen(false);
                            }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={cn(
                              "group p-5 md:p-4 rounded-[2rem] cursor-pointer flex items-center justify-between transition-all duration-300 border-2",
                              selectedIndex === idx 
                                ? "bg-zinc-900 border-zinc-900 text-white translate-x-3 shadow-2xl" 
                                : "hover:bg-zinc-50 border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-6">
                              <div className={cn(
                                "h-16 w-16 md:h-14 md:w-14 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0 shadow-inner overflow-hidden transition-all duration-700",
                                selectedIndex === idx && "bg-white/10 rotate-3 scale-110 shadow-none"
                              )}>
                                {item.image ? (
                                  <img src={item.image} className="w-full h-full object-cover mix-blend-multiply" alt="" />
                                ) : (
                                  <Package className={cn("h-7 w-7", selectedIndex === idx ? "text-white/20" : "text-zinc-300")} />
                                )}
                              </div>
                              <div className="text-left">
                                <div className="font-black text-xl md:text-lg italic tracking-tight uppercase leading-none mb-1.5 flex items-center gap-3">
                                  {item.productName}
                                  {item.searchScore === 100 && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    selectedIndex === idx ? "text-white/40" : "text-zinc-400"
                                  )}>
                                    {item.size} &bull; {item.category}
                                  </span>
                                  {item.pricing_type === 'bundle' && (
                                    <Badge className={cn(
                                      "px-2 py-0 text-[8px] font-black border-none uppercase h-4 tracking-[0.1em]",
                                      selectedIndex === idx ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-600"
                                    )}>
                                      Bundle Available
                                    </Badge>
                                  )}
                                  <div className={cn(
                                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                    item.stock < 5 ? "bg-red-500 text-white" : "bg-emerald-500/10 text-emerald-500",
                                    selectedIndex === idx && "bg-white/10 text-white border border-white/20"
                                  )}>
                                    {item.stock} {item.unit?.toUpperCase() || 'PCS'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="font-black text-2xl md:text-xl tracking-tighter italic">₹{item.base_price.toLocaleString()}</div>
                              <div className={cn(
                                "flex items-center gap-2 transition-all duration-500",
                                selectedIndex === idx ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                              )}>
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Add to Bill</span>
                                <ArrowRight className="h-5 w-5 text-blue-400" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="hidden md:flex items-center justify-between px-10 py-5 border-t border-zinc-100 bg-zinc-50/50">
                   <div className="flex items-center gap-6 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                     <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Arrows to Select</span>
                     <span className="flex items-center gap-2"><Command className="h-4 w-4" /> Enter to Add</span>
                   </div>
                   <div className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3 animate-pulse">
                     <div className="h-2 w-2 rounded-full bg-blue-600" /> SCANNER ACTIVE
                   </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
