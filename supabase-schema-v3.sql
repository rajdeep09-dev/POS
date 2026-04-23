-- Enterprise Supabase Schema V3 (Production-Ready SaaS)
-- Adds 25+ Features: RBAC, Shifts, Audits, Expenses, Suppliers, Taxes

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table (Updated)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    logo_url TEXT,
    theme_color TEXT DEFAULT '#3B82F6',
    active_features JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{"invoice_prefix": "INV", "printer_width": "80mm", "default_tax": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    owner_id UUID REFERENCES auth.users(id)
);

-- 2. Branches (Multi-branch support)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Profiles / RBAC
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id),
    branch_id UUID REFERENCES branches(id),
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'manager', 'cashier')) DEFAULT 'cashier',
    pin_code TEXT, -- Fast login for POS
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tenant Helper Function
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Core Tables (Added tenant_id and branch_id)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    name TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    image_url TEXT,
    tax_rate DECIMAL DEFAULT 0, -- Tax Engine
    hsn_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS variants (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    unit TEXT CHECK (unit IN ('pcs', 'kg', 'ltr', 'box')) DEFAULT 'pcs',
    stock DECIMAL DEFAULT 0,
    low_stock_threshold DECIMAL DEFAULT 5, -- Alert Engine
    cost_price DECIMAL DEFAULT 0,
    msp DECIMAL DEFAULT 0,
    base_price DECIMAL DEFAULT 0,
    barcode TEXT,
    batch_no TEXT, -- Expiry Engine
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 6. Shift Management
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES profiles(id),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    closed_at TIMESTAMP WITH TIME ZONE,
    starting_cash DECIMAL NOT NULL,
    expected_cash DECIMAL DEFAULT 0,
    actual_cash DECIMAL,
    notes TEXT,
    status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    version_clock BIGINT DEFAULT 0
);

-- 7. Advanced Sales & Split Payments
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    branch_id UUID REFERENCES branches(id),
    shift_id UUID REFERENCES shifts(id),
    customer_id UUID, -- References customers
    invoice_no TEXT NOT NULL,
    total_amount DECIMAL NOT NULL,
    tax_amount DECIMAL DEFAULT 0,
    discount DECIMAL DEFAULT 0,
    -- Split Payments
    cash_amount DECIMAL DEFAULT 0,
    upi_amount DECIMAL DEFAULT 0,
    card_amount DECIMAL DEFAULT 0,
    status TEXT CHECK (status IN ('completed', 'refunded', 'void')) DEFAULT 'completed',
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES variants(id),
    quantity DECIMAL NOT NULL,
    unit_price DECIMAL NOT NULL,
    tax_rate DECIMAL DEFAULT 0,
    subtotal DECIMAL NOT NULL,
    is_returned INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 8. Customers & Loyalty
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    gstin TEXT,
    address TEXT,
    balance DECIMAL DEFAULT 0,
    credit_limit DECIMAL DEFAULT 50000,
    loyalty_points DECIMAL DEFAULT 0, -- Loyalty Engine
    status TEXT DEFAULT 'active',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 9. Suppliers & Expenses
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    gstin TEXT,
    balance DECIMAL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    branch_id UUID REFERENCES branches(id),
    shift_id UUID REFERENCES shifts(id),
    category TEXT NOT NULL, -- e.g., 'Tea/Snacks', 'Logistics'
    amount DECIMAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL, -- e.g., 'DELETE_SALE', 'MANUAL_DISCOUNT'
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Legacy Support Tables
CREATE TABLE IF NOT EXISTS khata_transactions (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT,
    amount DECIMAL NOT NULL,
    payment_method TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE khata_transactions ENABLE ROW LEVEL SECURITY;

-- Generic Policy Generator for all tenant-data tables
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('branches', 'categories', 'products', 'variants', 'shifts', 'sales', 'sale_items', 'customers', 'suppliers', 'expenses', 'audit_logs', 'khata_transactions')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "TenantDataAccess" ON %I', t);
        EXECUTE format('CREATE POLICY "TenantDataAccess" ON %I FOR ALL TO authenticated USING (tenant_id = get_auth_tenant_id()) WITH CHECK (tenant_id = get_auth_tenant_id())', t);
    END LOOP;
END $$;
