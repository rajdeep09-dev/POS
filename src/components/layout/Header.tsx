"use client";

import { Bell, WifiOff, Cloud, Loader2, Clock, RefreshCcw, ChevronDown, DatabaseBackup, AlertCircle, Zap, ShieldCheck, Moon, Sun, Languages, BookOpen, Smartphone, Barcode, HardDrive, Undo2, Tag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());
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
      manual: "User Manual", welcome: "A-Z Operational Guide", last: "Last Sync", docs: "A-Z Guide",
      syncing: "Syncing...", error: "Sync Error", synced: "Cloud Synced", force: "Force Sync", clear: "Clear Cache"
    },
    bn: {
      title: "সিস্টেম কনসোল", pos: "পিওএস চেকআউট", inv: "মাস্টার ক্যাটালগ", khata: "ডিজিটাল খাতা", vault: "জিএসটি ভল্ট", history: "আর্কাইভস",
      manual: "ব্যবহারবিধি", welcome: "সম্পূর্ণ এ-টু-জেড গাইড", last: "শেষ সিঙ্ক", docs: "পূর্ণ নির্দেশিকা",
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
  else if (pathname === "/docs") displayTitle = t.manual;

  return (
    <header className="sticky top-0 z-40 flex h-24 items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-4 md:px-10 backdrop-blur-3xl shadow-sm text-left transition-colors">
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
          className="rounded-2xl h-10 w-10 md:h-12 md:w-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 transition-all font-black text-[10px] uppercase shadow-inner dark:text-white"
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
            <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-48 z-[2000] flex flex-col gap-1">
                <DropdownMenuItem onClick={() => router.push('/docs')} className="rounded-xl h-11 flex gap-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-blue-600">
                  <Info className="h-4 w-4" /> {t.docs}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleManualSync} className="rounded-xl h-11 flex gap-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white">
                  <DatabaseBackup className="h-4 w-4 text-emerald-600" /> {t.force}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { if(confirm("DANGER: Clear local cache?")) { await db.delete(); window.location.reload(); } }} className="rounded-xl h-11 flex gap-3 font-black text-[10px] uppercase tracking-widest text-red-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20">
                  <RefreshCcw className="h-4 w-4" /> {t.clear}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={() => router.push('/docs')} variant="ghost" size="icon" className="relative bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl border border-zinc-100 dark:border-zinc-700 h-10 w-10 md:h-12 md:w-12 shadow-inner shrink-0">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <span className="absolute top-3 right-3 h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-950 animate-pulse" />
        </Button>

        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 ring-4 ring-zinc-50 dark:ring-zinc-900 shadow-2xl shrink-0">
          <img src="/joyramlogo.png" alt="Logo" className="h-full w-full object-cover" />
        </div>
      </div>
    </header>
  );
}
