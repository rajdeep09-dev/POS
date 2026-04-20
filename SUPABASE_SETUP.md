# FINAL SUPABASE PRODUCTION SETUP (A-Z Sync)

To ensure your POS system works perfectly with the new features (KG/PCS units, History, multi-device sync), you must run this **Final SQL Script** in your Supabase project.

### ⚠️ IMPORTANT: This is a "One-Shot" Clean Reset
This script will **DROP** your existing tables and recreate them with the correct structure. If you have any test data you want to keep, back it up first.

---

### Step 1: Run the SQL
Copy the entire block below and paste it into your **Supabase Dashboard** -> **SQL Editor** and click **Run**.

```sql
-- Clean start
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS khata_transactions CASCADE;
DROP TABLE IF EXISTS variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS bills CASCADE;

-- 1. Products
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    gst_rate NUMERIC DEFAULT 18,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0
);

-- 2. Variants (Size/Weight)
CREATE TABLE variants (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    unit TEXT DEFAULT 'pcs',
    stock NUMERIC NOT NULL DEFAULT 0,
    dented_stock NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    base_price NUMERIC NOT NULL DEFAULT 0,
    msp NUMERIC NOT NULL DEFAULT 0,
    barcode TEXT,
    image_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0
);

-- 3. Customers
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0,
    last_tx TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0
);

-- 4. Sales
CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    total_amount NUMERIC NOT NULL,
    discount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    split_cash NUMERIC,
    split_upi NUMERIC,
    split_khata NUMERIC,
    customer_id TEXT REFERENCES customers(id),
    date TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    sync_status TEXT NOT NULL DEFAULT 'synced'
);

-- 5. Sale Items
CREATE TABLE sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
    variant_id TEXT REFERENCES variants(id),
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    updated_at TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0
);

-- 6. Bills (GST Vault)
CREATE TABLE bills (
    id TEXT PRIMARY KEY,
    supplier TEXT NOT NULL,
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    image_url TEXT,
    updated_at TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0
);

-- 7. Khata Transactions
CREATE TABLE khata_transactions (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    date TEXT NOT NULL,
    proof_image_url TEXT,
    notes TEXT,
    updated_at TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    sync_status TEXT NOT NULL DEFAULT 'synced'
);

-- Disable Row Level Security (RLS) for all tables
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE khata_transactions DISABLE ROW LEVEL SECURITY;
```

### Step 2: Refresh the Web App
1. Go back to your website.
2. Hard-refresh your browser (Ctrl + Shift + R or long-press refresh on phone).
3. The app will detect the new database structure and start syncing from scratch.

**Now, your "A to Z" sync is fully active!** Every change on any device will now perfectly propagate to the cloud.
