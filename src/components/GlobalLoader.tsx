"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function GlobalLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-none">
      <div className="flex flex-col items-center gap-2 bg-white/80 p-4 rounded-2xl shadow-xl border border-zinc-100">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
        <span className="text-[10px] font-black tracking-widest text-zinc-900 uppercase">Loading</span>
      </div>
    </div>
  );
}

export function GlobalLoader() {
  return (
    <Suspense fallback={null}>
      <GlobalLoaderInner />
    </Suspense>
  );
}
