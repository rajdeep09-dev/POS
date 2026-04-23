"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';

interface Tenant {
  id: string;
  business_name: string;
  logo_url: string | null;
  theme_color: string;
  active_features: string[];
}

interface TenantContextType {
  tenant: Tenant | null;
  role: 'admin' | 'manager' | 'cashier' | null;
  userId: string | null;
  isLoading: boolean;
  hasFeature: (feature: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

import { Loader2 } from 'lucide-react';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<'admin' | 'manager' | 'cashier' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function loadTenant() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      // 1. Get profile to find tenant_id and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.tenant_id) {
        console.error('No tenant associated with user');
        if (!pathname.includes('/onboarding') && !pathname.includes('/login') && !pathname.includes('/signup')) {
          router.push('/onboarding');
        }
        setIsLoading(false);
        return;
      }

      setRole(profile.role as 'admin' | 'manager' | 'cashier');

      // 2. Fetch tenant details
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();

      if (tenantError) {
        console.error('Error fetching tenant:', tenantError);
        setIsLoading(false);
        return;
      }

      setTenant(tenantData);
      
      // 3. Apply Dynamic Theming
      if (tenantData.theme_color) {
        document.documentElement.style.setProperty('--brand-primary', tenantData.theme_color);
        document.documentElement.style.setProperty('--brand-primary-foreground', '#ffffff');
      }

      setIsLoading(false);
    }

    loadTenant();
  }, [pathname, router]);

  const hasFeature = (feature: string) => {
    return tenant?.active_features?.includes(feature) ?? false;
  };

  // Prevent app render while checking session/tenant
  if (isLoading && !pathname.includes('/login') && !pathname.includes('/signup')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 animate-pulse">Initializing Terminal...</p>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant, role, userId, isLoading, hasFeature }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
