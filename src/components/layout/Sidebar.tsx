"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, FileText, Settings, History, RefreshCcw, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Command Center", href: "/", icon: LayoutDashboard },
  { name: "POS & Billing", href: "/pos", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Digital Khata", href: "/khata", icon: Users },
  { name: "Archives", href: "/history", icon: History },
  { name: "GST Vault", href: "/vault", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleResetSystem = async () => {
    if (confirm("DANGER: This will delete ALL local data and force a fresh sync. Proceed?")) {
        try {
            await db.delete();
            toast.success("Database Reset. Reloading...");
            setTimeout(() => window.location.reload(), 1500);
        } catch {
            toast.error("Reset failed");
        }
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white/50 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-100">
                <img src="/joyramlogo.png" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent italic">
                Joy Ram Steel
            </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t space-y-2">
        <Button variant="ghost" onClick={handleResetSystem} className="w-full justify-start text-xs font-black text-red-400 hover:text-red-600 hover:bg-red-50 gap-3 px-3 uppercase tracking-widest">
            <RefreshCcw className="h-4 w-4" /> Reset System
        </Button>
        <div className="text-xs text-center text-slate-400 font-medium flex flex-col items-center gap-1 pt-2">
            <span>Vyapar Sync v1.2</span>
        </div>
      </div>
    </div>
  );
}
