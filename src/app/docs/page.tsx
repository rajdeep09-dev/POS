"use client";

import { useState } from "react";
import { 
  BookOpen, Search, ChevronRight, Package, ShoppingCart, 
  Users, ShieldCheck, Barcode, FileText, Cloud, Layers, 
  LayoutDashboard, History, Globe, Trash2, Edit2, Plus, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

/**
 * Enterprise Admin Manual (/docs)
 * Full A-Z Bilingual Guide
 */
export default function Docs() {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [activeTab, setActiveTab] = useState("start");

  const sections = [
    { 
      id: "start", 
      icon: LayoutDashboard, 
      titleEn: "Dashboard & Navigation", 
      titleBn: "ড্যাশবোর্ড এবং নেভিগেশন",
      contentEn: "The home screen gives you a 'Low Stock Radar' and Profit estimators. Use the Bottom Dock to switch between modules. Red radar means items are critical.",
      contentBn: "হোম স্ক্রীন আপনাকে 'লো স্টক রাডার' এবং প্রফিট হিসাব দেখায়। মডিউল পরিবর্তনের জন্য নিচের ডক ব্যবহার করুন। লাল রাডার মানে স্টকের অবস্থা আশঙ্কাজনক।"
    },
    { 
      id: "pos", 
      icon: ShoppingCart, 
      titleEn: "POS & Billing", 
      titleBn: "পিওএস এবং বিলিং",
      contentEn: "Search products via Cmd+K or Scan. Use Alt+P for Quick Pay. You can 'Park' carts for later if a customer is waiting.",
      contentBn: "Cmd+K বা স্ক্যানের মাধ্যমে পণ্য খুঁজুন। দ্রুত পেমেন্টের জন্য Alt+P ব্যবহার করুন। কোনো কাস্টমার অপেক্ষা করলে আপনি কার্ট 'পার্ক' করে রাখতে পারেন।"
    },
    { 
      id: "stock", 
      icon: Package, 
      titleEn: "Inventory Management", 
      titleBn: "ইনভেন্টরি ম্যানেজমেন্ট",
      contentEn: "Add a 'Master Brand' first, then add 'Variants' (Sizes/Weights). Master Brands are the parent items, Variants are physical stock.",
      contentBn: "প্রথমে একটি 'মাস্টার ব্র্যান্ড' যোগ করুন, তারপর 'ভ্যারিয়েন্ট' (মাপ/ওজন) যোগ করুন। মাস্টার ব্র্যান্ড হল মূল পণ্য, ভ্যারিয়েন্ট হল আপনার আসল স্টক।"
    },
    { 
      id: "combo", 
      icon: Layers, 
      titleEn: "Combo & Bundles", 
      titleBn: "কম্বো এবং বান্ডেল",
      contentEn: "For items like 'Bowl Set of 4', use Bundle Strategy. Set 'Units in Pack' to 4 and 'Bundle Price' to the total discount price.",
      contentBn: "'বাটি সেট অফ ৪' এর মতো পণ্যের জন্য বান্ডেল কৌশল ব্যবহার করুন। 'ইউনিট ইন প্যাক' ৪ এবং 'বান্ডেল প্রাইস' মোট মূল্য সেট করুন।"
    },
    { 
      id: "weight", 
      icon: Layers, 
      titleEn: "Weight (KG) Sales", 
      titleBn: "ওজন (কেজি) বিক্রি",
      contentEn: "Select 'Weight' strategy in Inventory. The system supports 3-decimal precision (e.g. 10.250 KG) for industrial accuracy.",
      contentBn: "ইনভেন্টরিতে 'ওজন' কৌশল নির্বাচন করুন। সিস্টেম সঠিক হিসাবের জন্য ৩-দশমিক পর্যন্ত (যেমন ১০.২৫০ কেজি) সমর্থন করে।"
    },
    { 
      id: "scan", 
      icon: Barcode, 
      titleEn: "Barcode Recognition", 
      titleBn: "বারকোড রিকগনিশন",
      contentEn: "Use Laser Scanners for speed. Use Image Upload for Batch Recognition—upload a whole catalog page to add multiple items at once.",
      contentBn: "দ্রুত বিক্রির জন্য লেজার স্ক্যানার ব্যবহার করুন। ব্যাচ রিকগনিশনের জন্য ইমেজ আপলোড ব্যবহার করুন—একসাথে অনেক পণ্য যোগ করতে পুরো ক্যাটালগ পৃষ্ঠা আপলোড করুন।"
    },
    { 
      id: "export", 
      icon: Download, 
      titleEn: "Catalog Export", 
      titleBn: "ক্যাটালগ এক্সপোর্ট",
      contentEn: "Export your price list as HD Image or Pro PDF. PDF is optimized for scannable barcodes at 4x resolution.",
      contentBn: "আপনার প্রাইস লিস্ট এইচডি ইমেজ বা প্রো পিডিএফ হিসেবে এক্সপোর্ট করুন। পিডিএফ-এ ৪ গুণ রেজোলিউশনে স্ক্যানযোগ্য বারকোড তৈরি হয়।"
    },
    { 
      id: "gst", 
      icon: FileText, 
      titleEn: "GST & Invoicing", 
      titleBn: "জিএসটি এবং ইনভয়েসিং",
      contentEn: "Click 'Gen GST' after a sale. Combo items automatically calculate per-unit rates to match the total bundle value legally.",
      contentBn: "বিক্রির পর 'Gen GST' ক্লিক করুন। কম্বো আইটেমগুলো আইনিভাবে মোট মূল্যের সাথে মিল রাখতে স্বয়ংক্রিয়ভাবে প্রতি ইউনিটের দাম হিসাব করে নেয়।"
    },
    { 
      id: "khata", 
      icon: Users, 
      titleEn: "Khata & Credit", 
      titleBn: "খাতা এবং ক্রেডিট",
      contentEn: "Manage customer balances. Click the WhatsApp icon to send a payment reminder. Use 'Settle' to record payments.",
      contentBn: "কাস্টমারের বকেয়া ম্যানেজ করুন। পেমেন্ট রিমাইন্ডার পাঠাতে হোয়াটসঅ্যাপ আইকনে ক্লিক করুন। পেমেন্ট রেকর্ড করতে 'Settle' ব্যবহার করুন।"
    },
    { 
      id: "sync", 
      icon: Cloud, 
      titleEn: "Sync & Security", 
      titleBn: "সিঙ্ক এবং নিরাপত্তা",
      contentEn: "Data syncs automatically every 30s. Deleted images are auto-purged from cloud only if no other product uses them.",
      contentBn: "প্রতি ৩০ সেকেন্ডে ডেটা স্বয়ংক্রিয়ভাবে সিঙ্ক হয়। ডিলিট করা ছবিগুলো কেবল তখনই ক্লাউড থেকে মুছে ফেলা হয় যদি অন্য কোনো পণ্য সেগুলো ব্যবহার না করে।"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col md:flex-row pb-32 md:pb-0">
      {/* Navigation Sidebar */}
      <div className="w-full md:w-80 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 flex flex-col h-full md:sticky md:top-0">
        <div className="p-8 space-y-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-xl"><BookOpen className="h-6 w-6 text-white" /></div>
             <h1 className="text-2xl font-black italic tracking-tighter uppercase dark:text-white">Manual</h1>
           </div>
           
           <div className="flex bg-white dark:bg-zinc-800 p-1 rounded-xl shadow-inner gap-1">
              <button onClick={() => setLang('en')} className={cn("flex-1 h-9 rounded-lg font-black text-[10px] uppercase transition-all", lang === 'en' ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md" : "text-zinc-400")}>English</button>
              <button onClick={() => setLang('bn')} className={cn("flex-1 h-9 rounded-lg font-black text-[10px] uppercase transition-all", lang === 'bn' ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md" : "text-zinc-400")}>বাংলা</button>
           </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-8">
           <div className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group text-left",
                    activeTab === s.id ? "bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-700" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <s.icon className={cn("h-5 w-5", activeTab === s.id ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white")} />
                  <span className={cn("text-xs font-black uppercase tracking-widest", activeTab === s.id ? "text-zinc-900 dark:text-white" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300")}>
                    {lang === 'en' ? s.titleEn : s.titleBn}
                  </span>
                </button>
              ))}
           </div>
        </ScrollArea>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 md:p-20 overflow-y-auto bg-white dark:bg-zinc-950">
         <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl space-y-10 text-left"
            >
               {sections.find(s => s.id === activeTab) && (
                 <>
                   <div className="space-y-4">
                      <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center">
                        {(() => {
                          const Icon = sections.find(s => s.id === activeTab)!.icon;
                          return <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />;
                        })()}
                      </div>
                      <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase dark:text-white leading-[0.9]">
                        {lang === 'en' ? sections.find(s => s.id === activeTab)!.titleEn : sections.find(s => s.id === activeTab)!.titleBn}
                      </h2>
                   </div>

                   <div className="p-8 md:p-12 bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-inner">
                      <p className="text-2xl md:text-3xl font-bold dark:text-zinc-300 leading-relaxed text-zinc-600">
                        {lang === 'en' ? sections.find(s => s.id === activeTab)!.contentEn : sections.find(s => s.id === activeTab)!.contentBn}
                      </p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
                         <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Pro Tip / পরামর্শ</span>
                         <p className="text-sm font-bold dark:text-zinc-400 italic">
                           {activeTab === 'pos' ? "Try using Alt+K to focus search without touching the mouse." : "Ensure your catalog images are under 300KB for maximum speed."}
                         </p>
                      </div>
                      <div className="p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
                         <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Safety / নিরাপত্তা</span>
                         <p className="text-sm font-bold dark:text-zinc-400 italic">
                           Always verify the final price before generating the bill to ensure integrity.
                         </p>
                      </div>
                   </div>
                 </>
               )}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
}
