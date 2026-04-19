"use client";

import React, { useState } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProductSearchProps {
  onSelect: (item: any) => void;
  className?: string;
  placeholder?: string;
}

export function ProductSearch({ onSelect, className, placeholder = "Search products..." }: ProductSearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const catalog = useLiveQuery(async () => {
    const products = await db.products.toArray();
    const variants = await db.variants.toArray();
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

  const filtered = (catalog || []).filter(item => 
    item.productName.toLowerCase().includes(search.toLowerCase()) ||
    item.barcode?.includes(search)
  ).slice(0, 10);

  return (
    <div className={cn("relative z-[100]", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder={placeholder}
          className="pl-10 h-12 rounded-xl bg-zinc-50 border-zinc-100"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>

      <AnimatePresence>
        {isOpen && search.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 shadow-2xl rounded-2xl overflow-hidden max-h-[300px] flex flex-col"
          >
            <ScrollArea className="flex-1">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 font-bold uppercase tracking-widest text-[10px]">No results</div>
              ) : (
                filtered.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      setSearch("");
                      setIsOpen(false);
                    }}
                    className="p-3 hover:bg-zinc-50 border-b border-zinc-50 last:border-b-0 cursor-pointer flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="h-4 w-4 text-zinc-300" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-zinc-900 text-sm">{item.productName}</div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase">{item.size}</div>
                      </div>
                    </div>
                    <div className="font-black text-zinc-900 text-sm">₹{item.base_price}</div>
                  </div>
                ))
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
