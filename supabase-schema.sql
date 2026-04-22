-- Enterprise Supabase Schema V14
-- Professional Cloud Mirror for VyaparSyncDB V16

-- 1. Master Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 2. Variants (SKUs) Table
CREATE TABLE IF NOT EXISTS variants (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    unit TEXT CHECK (unit IN ('pcs', 'kg')) DEFAULT 'pcs',
    stock DECIMAL DEFAULT 0,
    dented_stock DECIMAL DEFAULT 0,
    cost_price DECIMAL DEFAULT 0,
    msp DECIMAL DEFAULT 0,
    base_price DECIMAL DEFAULT 0,
    barcode TEXT UNIQUE,
    image_url TEXT,
    pricing_type TEXT CHECK (pricing_type IN ('standard', 'bundle')) DEFAULT 'standard',
    bundle_qty INTEGER,
    bundle_price DECIMAL,
    units_per_combo DECIMAL DEFAULT 1,
    parent_pack_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 3. Sales Header Table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY,
    total_amount DECIMAL NOT NULL,
    discount DECIMAL DEFAULT 0,
    payment_method TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_returned INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 4. Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES variants(id),
    quantity DECIMAL NOT NULL,
    unit_price DECIMAL NOT NULL,
    subtotal DECIMAL NOT NULL,
    is_returned INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    balance DECIMAL DEFAULT 0,
    credit_limit DECIMAL DEFAULT 50000,
    status TEXT CHECK (status IN ('active', 'blocked')) DEFAULT 'active',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 6. Khata Transactions Table
CREATE TABLE IF NOT EXISTS khata_transactions (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('credit', 'payment')),
    amount DECIMAL NOT NULL,
    note TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 7. Digital Bills Table (GST / eWay)
CREATE TABLE IF NOT EXISTS digital_bills (
    id UUID PRIMARY KEY,
    type TEXT CHECK (type IN ('gst', 'eway')),
    bill_no TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    customer_name TEXT,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- 8. Dynamic Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted INTEGER DEFAULT 0,
    version_clock BIGINT DEFAULT 0
);

-- RLS & Indices for Holographic Performance
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE khata_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anonymous Access Policy (For Local Sync)
CREATE POLICY "Public Read/Write Access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON khata_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON digital_bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Performance Indices
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_variants_barcode ON variants(barcode);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_categories_name ON categories(name);
