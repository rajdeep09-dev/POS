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

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<'admin' | 'manager' | 'cashier' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function loadTenant() {
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
        if (!pathname.includes('/onboarding')) {
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
        // Generate a slightly darker/lighter version if needed, or just use opacity
        document.documentElement.style.setProperty('--brand-primary-foreground', '#ffffff');
      }

      setIsLoading(false);
    }

    loadTenant();
  }, [pathname, router]);

  const hasFeature = (feature: string) => {
    return tenant?.active_features?.includes(feature) ?? false;
  };

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
