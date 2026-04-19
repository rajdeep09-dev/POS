"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function SyncEngine() {
  const isSyncing = useRef(false);
  const [lastSyncTime, setLastSyncSyncTime] = useState<string | null>(null);

  useEffect(() => {
    // Sync Interval
    const syncInterval = setInterval(async () => {
      if (isSyncing.current) return;
      
      // Skip if placeholder credentials
      if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
          !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return;
      }

      isSyncing.current = true;
      
      try {
        const tables = [
          { name: 'products', db: db.products },
          { name: 'variants', db: db.variants },
          { name: 'customers', db: db.customers },
          { name: 'khata_transactions', db: db.khata_transactions },
          { name: 'sales', db: db.sales },
          { name: 'sale_items', db: db.sale_items },
          { name: 'bills', db: db.bills }
        ];

        for (const table of tables) {
          // --- 1. PULL CHANGES FROM CLOUD ---
          // Fetch items updated since our last sync
          let query = supabase.from(table.name).select('*');
          if (lastSyncTime) {
            query = query.gt('updated_at', lastSyncTime);
          }
          
          const { data: cloudChanges, error: pullError } = await query;
          
          if (!pullError && cloudChanges && cloudChanges.length > 0) {
            // Smart Merge: Only update local if cloud is newer
            for (const cloudItem of cloudChanges) {
              const localItem = await (table.db as any).get(cloudItem.id);
              if (!localItem || new Date(cloudItem.updated_at) > new Date(localItem.updated_at)) {
                await (table.db as any).put(cloudItem);
              }
            }
          }

          // --- 2. PUSH LOCAL CHANGES TO CLOUD ---
          // Fetch local items updated since last sync or marked as pending
          const localChanges = await (table.db as any).toArray();
          const toPush = localChanges.filter((item: any) => {
             if (item.sync_status === 'pending') return true;
             if (!lastSyncTime) return true;
             return new Date(item.updated_at) > new Date(lastSyncTime);
          });

          if (toPush.length > 0) {
            // Clean items before push (remove sync_status if it's local only)
            const cleanedPush = toPush.map((item: any) => {
              const { sync_status, ...rest } = item;
              return rest;
            });

            const { error: pushError } = await supabase.from(table.name).upsert(cleanedPush);
            
            if (!pushError) {
              // Mark as synced locally
              const syncedItems = toPush.map((item: any) => ({ ...item, sync_status: 'synced' }));
              await (table.db as any).bulkPut(syncedItems);
            }
          }
        }

        setLastSyncSyncTime(new Date().toISOString());

      } catch (err) {
        console.error("Critical Sync Error:", err);
      } finally {
        isSyncing.current = false;
      }
    }, 5000); // 5 seconds interval for production stability

    return () => clearInterval(syncInterval);
  }, [lastSyncTime]);

  return null;
}
