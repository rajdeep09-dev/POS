-- Enterprise Supabase Schema V2 (Multi-Tenant SaaS Refactor)
-- Optimized for Multi-Tenancy with Strict RLS

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    logo_url TEXT,
    theme_color TEXT DEFAULT '#3B82F6',
    active_features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    owner_id UUID REFERENCES auth.users(id)
);

-- 2. Profiles (Link Users to Tenants)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id),
    full_name TEXT,
    role TEXT DEFAULT 'admin',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tenant Helper Function for RLS
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Alter Existing Tables to include tenant_id
-- We add tenant_id as a required field for multi-tenancy.

-- Categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- Variants
ALTER TABLE variants ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- Sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- Sale Items
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- Khata Transactions
ALTER TABLE khata_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- Bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- Digital Bills
ALTER TABLE digital_bills ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 5. Seed Initial Tenant (Joyram Steel)
-- This is a placeholder; in a real migration, we would assign existing data to this ID.
-- INSERT INTO tenants (id, business_name, theme_color) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Joyram Steel', '#ef4444');

-- 6. Enable RLS on New Tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies

-- Tenants: Owners can see their own tenant, members can see their tenant
CREATE POLICY "View own tenant" ON tenants
    FOR SELECT
    TO authenticated
    USING (id = get_auth_tenant_id() OR owner_id = auth.uid());

CREATE POLICY "Update own tenant" ON tenants
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Profiles: Users can see their own profile or others in the same tenant
CREATE POLICY "View profiles in same tenant" ON profiles
    FOR SELECT
    TO authenticated
    USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Generic Policy Generator for all tenant-data tables
-- DROP existing anonymous policies first if they exist
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('products', 'variants', 'sales', 'sale_items', 'customers', 'khata_transactions', 'bills', 'digital_bills', 'categories')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "SyncAccess" ON %I', t);
        EXECUTE format('CREATE POLICY "TenantDataAccess" ON %I FOR ALL TO authenticated USING (tenant_id = get_auth_tenant_id()) WITH CHECK (tenant_id = get_auth_tenant_id())', t);
    END LOOP;
END $$;
