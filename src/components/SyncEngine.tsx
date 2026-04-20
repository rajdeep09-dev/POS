"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function SyncEngine() {
  const isSyncing = useRef(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Use localStorage to remember last sync time across refreshes
  useEffect(() => {
    const saved = localStorage.getItem('last_db_sync');
    if (saved) setLastSyncTime(saved);
  }, []);

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      await performSync();
    }, 10000); // Polling every 10s for battery/data efficiency

    // Listen for manual sync requests
    const handleManualSync = () => performSync();
    window.addEventListener('request-sync', handleManualSync);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('request-sync', handleManualSync);
    };
  }, [lastSyncTime]);

  const performSync = async () => {
    if (isSyncing.current) return;
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return;
    }

    isSyncing.current = true;
    const syncStartTime = new Date().toISOString();
    
    try {
      const tables = [
        { name: 'products', db: db.products },
        { name: 'variants', db: db.variants },
        { name: 'customers', db: db.customers },
        { name: 'khata_transactions', db: db.khata_transactions },
        { name: 'sales', db: db.sales },
        { name: 'sale_items', db: db.sale_items },
        { name: 'bills', db: db.bills },
        { name: 'digital_bills', db: db.digital_bills }
      ];

      for (const table of tables) {
        // --- 1. PULL FROM CLOUD ---
        let pullQuery = supabase.from(table.name).select('*');
        // If we have a last sync time, only pull what's newer
        if (lastSyncTime) {
          pullQuery = pullQuery.gt('updated_at', lastSyncTime);
        }
        
        const { data: cloudChanges, error: pullError } = await pullQuery;
        
        if (pullError) {
            console.error(`Pull error [${table.name}]:`, pullError);
        } else if (cloudChanges && cloudChanges.length > 0) {
          for (const cloudItem of cloudChanges) {
            const localItem = await (table.db as any).get(cloudItem.id);
            // Conflict Resolution: Cloud wins if newer
            if (!localItem || new Date(cloudItem.updated_at) > new Date(localItem.updated_at)) {
              await (table.db as any).put({ ...cloudItem, sync_status: 'synced' });
            }
          }
        }

        // --- 2. PUSH TO CLOUD ---
        // Fetch items that are pending sync
        const toPush = await (table.db as any)
          .where('sync_status').equals('pending')
          .toArray();

        if (toPush.length > 0) {
          const cleanedPush = toPush.map((item: any) => {
            const { sync_status, ...rest } = item;
            return rest;
          });

          const { error: pushError } = await supabase.from(table.name).upsert(cleanedPush);
          
          if (pushError) {
            console.error(`Push error [${table.name}]:`, pushError);
          } else {
            // Mark successfully pushed items as synced
            const syncedItems = toPush.map((item: any) => ({ ...item, sync_status: 'synced' }));
            await (table.db as any).bulkPut(syncedItems);
          }
        }
      }

      setLastSyncTime(syncStartTime);
      localStorage.setItem('last_db_sync', syncStartTime);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('database-synced', { detail: syncStartTime }));
      }

    } catch (err) {
      console.error("Critical Sync Failure:", err);
    } finally {
      isSyncing.current = false;
    }
  };

  return null;
}
