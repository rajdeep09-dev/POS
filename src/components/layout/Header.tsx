"use client";

import { Bell, WifiOff, Cloud, Loader2, Clock, RefreshCcw, ChevronDown, DatabaseBackup, AlertCircle, Zap, ShieldCheck, Moon, Sun, Languages, BookOpen, Smartphone, Barcode, HardDrive, Undo2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isManualOpen, setIsManualOpen] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('app_lang') as 'en' | 'bn';
    if (savedLang) setLang(savedLang);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleSyncTime = (e: any) => setLastSync(e.detail);
    const handleSyncStatus = (e: any) => setSyncState(e.detail);
    window.addEventListener('database-synced', handleSyncTime);
    window.addEventListener('sync-status', handleSyncStatus);
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const saved = localStorage.getItem('last_db_sync');
    if (saved) setLastSync(saved);
    return () => {
      clearInterval(timer);
      window.removeEventListener('database-synced', handleSyncTime);
      window.removeEventListener('sync-status', handleSyncStatus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'bn' : 'en';
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
    toast.success(newLang === 'bn' ? "ভাষা পরিবর্তন করা হয়েছে" : "Language Switched to English");
    window.dispatchEvent(new CustomEvent('lang-changed', { detail: newLang }));
  };

  const handleManualSync = () => {
    toast.info("Triggering Cloud Sync...");
    window.dispatchEvent(new Event('request-sync'));
  };

  const translations = {
    en: {
      title: "System Console", pos: "POS Checkout", inv: "Master Catalog", khata: "Digital Khata", vault: "GST Vault", history: "Archives",
      manual: "Enterprise Admin Manual", welcome: "A-Z Operational Guide for Joy Ram Steel.", btn: "Confirm & Close", last: "Last Sync",
      syncing: "Syncing...", error: "Sync Error", synced: "Cloud Synced", force: "Force Sync", clear: "Clear Cache"
    },
    bn: {
      title: "সিস্টেম কনসোল", pos: "পিওএস চেকআউট", inv: "মাস্টার ক্যাটালগ", khata: "ডিজিটাল খাতা", vault: "জিএসটি ভল্ট", history: "আর্কাইভস",
      manual: "এন্টারপ্রাইজ অ্যাডমিন ম্যানুয়াল", welcome: "জয় রাম স্টিলের জন্য সম্পূর্ণ এ-টু-জেড গাইড।", btn: "নিশ্চিত করুন", last: "শেষ সিঙ্ক",
      syncing: "সিঙ্ক হচ্ছে...", error: "সিঙ্ক ত্রুটি", synced: "ক্লাউড সিঙ্কড", force: "ম্যানুয়াল সিঙ্ক", clear: "ক্যাশ মুছুন"
    }
  };

  const t = translations[lang];

  let displayTitle = t.title;
  if (pathname === "/pos") displayTitle = t.pos;
  else if (pathname === "/inventory") displayTitle = t.inv;
  else if (pathname === "/khata") displayTitle = t.khata;
  else if (pathname === "/vault") displayTitle = t.vault;
  else if (pathname === "/history") displayTitle = t.history;

  const fullManual = [
    {
      icon: <Zap className="h-5 w-5 text-blue-500" />,
      en: { title: "01. Billing Mastery", desc: "Open the POS. You can add items in 3 ways: 1) Handheld Laser Scanner 2) Mobile Camera Button 3) Barcode Image Upload. The system auto-detects barcodes and adds them instantly without clicking." },
      bn: { title: "০১. বিলিং মাস্টারী", desc: "পিওএস (POS) খুলুন। আপনি ৩টি উপায়ে আইটেম যোগ করতে পারেন: ১) হ্যান্ডহেল্ড লেজার স্ক্যানার ২) মোবাইল ক্যামেরা বাটন ৩) বারকোড ইমেজ আপলোড। সিস্টেম অটোমেটিক বারকোড শনাক্ত করে এবং ক্লিক ছাড়াই আইটেম যোগ করে।" }
    },
    {
      icon: <Tag className="h-5 w-5 text-purple-500" />,
      en: { title: "02. Pricing Modes", desc: "Standard: Sell 1 piece. Combo/Bundle: Sell a pack (e.g., 4 for 100). The system will deduct exactly 4 units from stock. Weight: Sold by Kg for hardware items." },
      bn: { title: "০২. প্রাইসিং মোড", desc: "স্ট্যান্ডার্ড: ১ পিস বিক্রি করুন। কম্বো/বান্ডিল: প্যাক বিক্রি করুন (যেমন ৪টি ১০০ টাকায়)। সিস্টেম স্টক থেকে ৪টি আইটেমই বিয়োগ করবে। ওজন: হার্ডওয়্যার আইটেমের জন্য কেজি হিসেবে বিক্রি করুন।" }
    },
    {
      icon: <Undo2 className="h-5 w-5 text-red-500" />,
      en: { title: "03. Sales Returns", desc: "Go to Archives. Click the Red Rotate button. This reverses the sale revenue AND automatically adds the items back to your physical stock count." },
      bn: { title: "০৩. সেলস রিটার্ন", desc: "আর্কাইভস (Archives) এ যান। লাল রোটেট বাটনে ক্লিক করুন। এটি বিক্রির টাকা বিয়োগ করবে এবং আইটেমগুলো অটোমেটিক স্টকে ফেরত যোগ করবে।" }
    },
    {
      icon: <BookOpen className="h-5 w-5 text-amber-500" />,
      en: { title: "04. Digital Khata", desc: "Add customers. Use 'Receive Payment' to reduce balance. Click 'Download Ledger' to get a professional A4 PDF statement to give to the customer." },
      bn: { title: "০৪. ডিজিটাল খাতা", desc: "কাস্টমার যোগ করুন। ব্যালেন্স কমাতে 'Receive Payment' ব্যবহার করুন। কাস্টমারকে দেওয়ার জন্য প্রফেশনাল A4 PDF স্টেটমেন্ট পেতে 'Download Ledger' ক্লিক করুন।" }
    },
    {
      icon: <Smartphone className="h-5 w-5 text-emerald-500" />,
      en: { title: "05. PWA (App Install)", desc: "Open this site on your mobile browser. Click 'Add to Home Screen' in browser settings. The app will now open full-screen and work even without Internet." },
      bn: { title: "০৫. PWA (অ্যাপ ইনস্টল)", desc: "আপনার মোবাইল ব্রাউজারে এই সাইটটি খুলুন। ব্রাউজার সেটিংসে 'Add to Home Screen' ক্লিক করুন। অ্যাপটি এখন ফুল-স্ক্রিনে খুলবে এবং ইন্টারনেট ছাড়াও কাজ করবে।" }
    },
    {
      icon: <HardDrive className="h-5 w-5 text-zinc-500" />,
      en: { title: "06. Deletion Logic", desc: "To delete a Master Brand, you must delete all its Variants (sizes) first. This protects your data integrity." },
      bn: { title: "০৬. ডিলিট লজিক", desc: "একটি মাস্টার ব্র্যান্ড ডিলিট করতে হলে প্রথমে তার সব ভ্যারিয়েন্ট (সাইজ) ডিলিট করতে হবে। এটি আপনার ডেটা সুরক্ষিত রাখে।" }
    }
  ];

  return (
    <header className="sticky top-0 z-40 flex h-24 items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-4 md:px-10 backdrop-blur-3xl shadow-sm text-left transition-colors">
      <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] bg-white dark:bg-zinc-900 border-none shadow-2xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-10 pb-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
             <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase mb-2 flex items-center gap-3 dark:text-white">
                <ShieldCheck className="h-10 w-10 text-blue-600" /> {t.manual}
             </DialogTitle>
             <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] leading-relaxed">{t.welcome}</p>
          </div>

          <ScrollArea className="flex-1 p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
              {fullManual.map((step, i) => (
                <div key={i} className="p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-xl hover:border-zinc-200 dark:hover:border-zinc-700">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl shadow-inner">{step.icon}</div>
                      <h4 className="font-black text-sm uppercase italic tracking-tight dark:text-white leading-tight">{step[lang].title}</h4>
                   </div>
                   <p className="text-[11px] font-bold leading-relaxed text-zinc-500 dark:text-zinc-400">{step[lang].desc}</p>
                </div>
              ))}
            </div>
            <Button onClick={()=>setIsManualOpen(false)} className="w-full h-20 rounded-[2rem] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-widest shadow-2xl mt-4 active:scale-95 transition-transform text-xs">
               {t.btn}
            </Button>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex flex-col">
            <span className="text-xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none truncate max-w-[150px] md:max-w-none">{displayTitle}</span>
            <div className="mt-1 flex items-center gap-2 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="tabular-nums">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleLang}
          className="rounded-2xl h-10 w-10 md:h-12 md:w-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 transition-all font-black text-[10px] uppercase shadow-inner"
        >
          {lang === 'en' ? 'BN' : 'EN'}
        </Button>

        {mounted && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-2xl h-10 w-10 md:h-12 md:w-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 transition-all shadow-inner"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />}
          </Button>
        )}

        <DropdownMenu>
            <DropdownMenuTrigger>
                <div className="flex flex-col items-end gap-1.5 mr-1 md:mr-2 cursor-pointer group">
                    {isOnline && (
                      <div className={`flex items-center gap-2 px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all
                        ${syncState === 'syncing' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40' : 
                          syncState === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40' : 
                          'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/40 group-hover:bg-emerald-100'}`}>
                        {syncState === 'syncing' ? <Loader2 className="h-3 w-3 animate-spin" /> : syncState === 'error' ? <AlertCircle className="h-3 w-3" /> : <Cloud className="h-3 w-3" />}
                        <span className="hidden sm:inline">{syncState === 'syncing' ? t.syncing : syncState === 'error' ? t.error : t.synced}</span>
                        <ChevronDown className="h-2 w-2 ml-1 opacity-40" />
                      </div>
                    )}
                    {lastSync && <span className="text-[7px] md:text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter hidden md:block">{t.last}: {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-48 z-[2000]">
                <DropdownMenuItem onClick={handleManualSync} className="rounded-xl h-11 flex gap-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white"><DatabaseBackup className="h-4 w-4 text-blue-600" /> {t.force}</DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { if(confirm("DANGER: Clear local cache?")) { await db.delete(); window.location.reload(); } }} className="rounded-xl h-11 flex gap-3 font-black text-[10px] uppercase tracking-widest text-red-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20"><RefreshCcw className="h-4 w-4" /> {t.clear}</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={()=>setIsManualOpen(true)} variant="ghost" size="icon" className="relative bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl border border-zinc-100 dark:border-zinc-700 h-10 w-10 md:h-12 md:w-12 shadow-inner shrink-0">
          <Bell className="h-5 w-5 text-zinc-900 dark:text-white" />
          <span className="absolute top-3 right-3 h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-red-500 border-2 border-white dark:border-zinc-950" />
        </Button>

        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 ring-4 ring-zinc-50 dark:ring-zinc-900 shadow-2xl shrink-0">
          <img src="/joyramlogo.png" alt="Logo" className="h-full w-full object-cover" />
        </div>
      </div>
    </header>
  );
}
