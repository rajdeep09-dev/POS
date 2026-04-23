"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useTenant } from "@/components/providers/TenantProvider";

export function SyncEngine() {
  const isSyncing = useRef(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { tenant } = useTenant();

  useEffect(() => {
    if (!tenant?.id) return;

    const saved = localStorage.getItem(`last_db_sync_${tenant.id}`);
    if (saved) setLastSyncTime(saved);

    const syncInterval = setInterval(async () => {
      await performSync();
    }, 30000); 

    const handleManualSync = () => performSync(true);
    window.addEventListener('request-sync', handleManualSync);
    performSync();

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('request-sync', handleManualSync);
    };
  }, [tenant?.id]);

  const performSync = async (isForce = false) => {
    if (isSyncing.current || !tenant?.id) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) return;

    isSyncing.current = true;
    window.dispatchEvent(new CustomEvent('sync-status', { detail: 'syncing' }));
    
    try {
      const tables = [
        { name: 'products', db: db.products },
        { name: 'variants', db: db.variants },
        { name: 'customers', db: db.customers },
        { name: 'khata_transactions', db: db.khata_transactions },
        { name: 'sales', db: db.sales },
        { name: 'sale_items', db: db.sale_items },
        { name: 'bills', db: db.bills },
        { name: 'digital_bills', db: db.digital_bills },
        { name: 'categories', db: db.categories },
        { name: 'shifts', db: db.shifts },
        { name: 'suppliers', db: db.suppliers },
        { name: 'expenses', db: db.expenses },
        { name: 'audit_logs', db: db.audit_logs }
      ];

      for (const table of tables) {
        try {
          // 1. PULL & PURGE (Tenant Restricted)
          let pullQuery = supabase
            .from(table.name)
            .select('*')
            .eq('tenant_id', tenant.id);
          
          if (!isForce && lastSyncTime) {
            pullQuery = pullQuery.gt('updated_at', lastSyncTime);
          }
          
          const { data: cloudChanges, error: pullError } = await pullQuery;
          
          if (pullError) {
            console.error(`Sync Pull Error on [${table.name}]:`, pullError.message);
            continue;
          }

          if (cloudChanges && cloudChanges.length > 0) {
            for (const cloudItem of cloudChanges) {
              if (cloudItem.is_deleted === 1) {
                await (table.db as any).delete(cloudItem.id);
                continue; 
              }

              const localItem = await (table.db as any).get(cloudItem.id);
              const cloudClock = cloudItem.version_clock || 0;
              const localClock = localItem?.version_clock || 0;
              
              if (localItem?.is_deleted === 1) continue;

              if (!localItem || cloudClock > localClock || (cloudClock === localClock && new Date(cloudItem.updated_at) > new Date(localItem.updated_at))) {
                await (table.db as any).put({ ...cloudItem, sync_status: 'synced' });
              }
            }
          }

          // 2. PUSH (Tenant Injected)
          const toPush = await (table.db as any)
            .where('sync_status').equals('pending')
            .filter((item: any) => item.tenant_id === tenant.id)
            .toArray();

          if (toPush.length > 0) {
            const cleanedPush = toPush.map((item: any) => {
              const { sync_status, ...rest } = item;
              return { ...rest, tenant_id: tenant.id }; // Ensure tenant_id is present
            });

            const { error: pushError } = await supabase.from(table.name).upsert(cleanedPush);
            if (!pushError) {
              const syncedItems = toPush.map((item: any) => ({ ...item, sync_status: 'synced' }));
              await (table.db as any).bulkPut(syncedItems);
            } else {
              console.error(`Push Failure on [${table.name}]:`, pushError.message);
            }
          }
        } catch (tableErr) {
          console.error(`Resilience Engine Error [${table.name}]`, tableErr);
        }
      }

      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem(`last_db_sync_${tenant.id}`, now);
      window.dispatchEvent(new CustomEvent('database-synced', { detail: now }));
      window.dispatchEvent(new CustomEvent('sync-status', { detail: 'idle' }));

    } catch (err) {
      console.error("Global Sync Error:", err);
      window.dispatchEvent(new CustomEvent('sync-status', { detail: 'error' }));
    } finally {
      isSyncing.current = false;
    }
  };

  return null;
}
