"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, Shift } from '@/lib/db';
import { useTenant } from './TenantProvider';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface ShiftContextType {
  activeShift: Shift | null | undefined;
  isLoading: boolean;
  openShift: (startingCash: number, notes?: string) => Promise<void>;
  closeShift: (actualCash: number, expectedCash: number, notes?: string) => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const { tenant, userId, isLoading: isTenantLoading } = useTenant();
  const [isLoading, setIsLoading] = useState(true);

  // Use live query to automatically react to Dexie changes
  const activeShift = useLiveQuery(async () => {
    if (!userId || !tenant?.id) return null;
    const shift = await db.shifts
      .where('status').equals('open')
      .and(s => s.user_id === userId && s.tenant_id === tenant.id)
      .first();
    setIsLoading(false);
    return shift || null;
  }, [userId, tenant?.id]);

  useEffect(() => {
    if (!isTenantLoading && !userId) {
      setIsLoading(false); // No user, so no shift to load
    }
  }, [isTenantLoading, userId]);

  const openShift = async (startingCash: number, notes?: string) => {
    if (!tenant?.id || !userId) {
      toast.error("Authentication Error", { description: "Cannot open shift. User or Tenant missing." });
      return;
    }
    
    if (activeShift) {
      toast.error("Shift already open");
      return;
    }

    try {
      const newShift: Shift = {
        id: uuidv4(),
        tenant_id: tenant.id,
        user_id: userId,
        status: 'open',
        opened_at: new Date().toISOString(),
        starting_cash: startingCash,
        expected_cash: startingCash,
        notes,
        sync_status: 'pending',
        version_clock: Date.now()
      };
      
      await db.shifts.add(newShift);
      toast.success("Shift Opened Successfully", { description: `Starting float: ₹${startingCash}` });
    } catch (error) {
      console.error("Failed to open shift:", error);
      toast.error("Failed to open shift", { description: "Database error occurred." });
    }
  };

  const closeShift = async (actualCash: number, expectedCash: number, notes?: string) => {
    if (!activeShift) {
      toast.error("No active shift to close");
      return;
    }

    try {
      await db.shifts.update(activeShift.id, {
        status: 'closed',
        closed_at: new Date().toISOString(),
        actual_cash: actualCash,
        expected_cash: expectedCash,
        notes,
        sync_status: 'pending',
        version_clock: Date.now()
      });
      toast.success("Shift Closed", { description: "Z-Report successfully saved." });
    } catch (error) {
      console.error("Failed to close shift:", error);
      toast.error("Failed to close shift");
    }
  };

  return (
    <ShiftContext.Provider value={{ activeShift, isLoading: isLoading || isTenantLoading, openShift, closeShift }}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
