"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, Users, ShieldCheck, LayoutDashboard, History, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FeatureGate } from "@/components/ui/FeatureGate";

/**
 * Enterprise Holographic Dock
 * Uses fluid layout transitions and high-contrast active states.
 */
export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/pos", label: "POS", icon: ShoppingCart },
    { href: "/inventory", label: "Stock", icon: Package },
    { href: "/expenses", label: "Expenses", icon: IndianRupee },
    { href: "/khata", label: "Khata", icon: Users, feature: "digital_khata" },
    { href: "/vault", label: "Vault", icon: ShieldCheck, feature: "gst_vault" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg pointer-events-none">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-between"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const content = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-3 px-4 rounded-3xl transition-all duration-500 group",
                isActive ? "text-primary" : "text-zinc-400 dark:text-zinc-600"
              )}
            >
              {/* Active Indicator (Holographic Capsule) */}
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-primary/10 rounded-3xl -z-10 border border-primary/20 shadow-inner"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <motion.div
                whileTap={{ scale: 0.8 }}
                className="relative z-10"
              >
                <item.icon className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-500",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
              </motion.div>
              
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest leading-none relative z-10",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40 transition-opacity"
              )}>
                {item.label}
              </span>

              {/* Glowing Active Dot */}
              {isActive && (
                <motion.div 
                  layoutId="nav-dot"
                  className="absolute -bottom-1 h-1 w-1 bg-primary rounded-full shadow-[0_0_10px_var(--brand-primary)]"
                />
              )}
            </Link>
          );

          if (item.feature) {
            return <FeatureGate key={item.href} feature={item.feature}>{content}</FeatureGate>;
          }

          return content;
        })}
      </motion.nav>
    </div>
  );
}
