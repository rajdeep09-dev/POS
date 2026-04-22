import Dexie, { type EntityTable } from 'dexie';

/**
 * Industrial Schema V16.1 (Nuclear Audit Verified)
 * Optimized for JSONB Cloud Sync and Type-Safety.
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Variant {
  id: string;
  product_id: string;
  size: string;
  unit: 'pcs' | 'kg';
  stock: number;
  dented_stock: number;
  cost_price: number;
  msp: number;
  base_price: number;
  barcode?: string;
  image_url?: string;
  pricing_type: 'standard' | 'bundle';
  bundle_qty?: number;
  bundle_price?: number;
  units_per_combo: number;
  parent_pack_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Sale {
  id: string;
  total_amount: number;
  discount: number;
  payment_method: string;
  customer_id?: string;
  date: string;
  is_returned?: number;
  return_date?: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_returned?: number;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  balance: number;
  credit_limit: number;
  status: 'active' | 'blocked' | 'Overdue' | 'Clear';
  last_tx?: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface KhataTransaction {
  id: string;
  customer_id: string;
  type: 'credit' | 'payment' | 'payment_received';
  amount: number;
  payment_method?: string;
  proof_image_url?: string;
  note?: string;
  notes?: string;
  date: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Bill {
  id: string;
  bill_no: string;
  supplier: string;
  total_amount: number;
  amount?: number;
  status: 'paid' | 'pending' | 'Paid' | 'Pending';
  image_url?: string;
  date: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface DigitalBill {
  id: string;
  type: 'gst' | 'eway';
  bill_no: string;
  date: string;
  customer_name: string;
  data: any; // Switched to any/object for JSONB compatibility
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Category {
  id: string;
  name: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface ParkedCart {
  id: string;
  customer_name?: string;
  items: any[];
  total: number;
  created_at: string;
}

const db = new Dexie('VyaparSyncDB') as Dexie & {
  products: EntityTable<Product, 'id'>;
  variants: EntityTable<Variant, 'id'>;
  sales: EntityTable<Sale, 'id'>;
  sale_items: EntityTable<SaleItem, 'id'>;
  customers: EntityTable<Customer, 'id'>;
  khata_transactions: EntityTable<KhataTransaction, 'id'>;
  bills: EntityTable<Bill, 'id'>;
  digital_bills: EntityTable<DigitalBill, 'id'>;
  parked_carts: EntityTable<ParkedCart, 'id'>;
  categories: EntityTable<Category, 'id'>;
};

// V16.1: Formal Alignment for JSONB and Case Sensitivity
db.version(16.1).stores({
  products: 'id, name, category, image_url, updated_at, is_deleted, sync_status, version_clock', 
  variants: 'id, product_id, size, barcode, pricing_type, bundle_price, bundle_qty, updated_at, is_deleted, unit, sync_status, version_clock, parent_pack_id', 
  sales: 'id, date, payment_method, customer_id, sync_status, updated_at, is_deleted, version_clock, is_returned',
  sale_items: 'id, sale_id, variant_id, updated_at, is_deleted, sync_status, version_clock, is_returned',
  customers: 'id, name, phone, status, updated_at, is_deleted, sync_status, version_clock, credit_limit',
  khata_transactions: 'id, customer_id, date, sync_status, updated_at, is_deleted, version_clock',
  bills: 'id, supplier, status, updated_at, is_deleted, sync_status, version_clock',
  digital_bills: 'id, type, bill_no, customer_name, date, sync_status, updated_at, is_deleted, version_clock',
  categories: 'id, name, updated_at, is_deleted, sync_status, version_clock',
  parked_carts: 'id, created_at'
});

db.on('versionchange', function() {
  db.close();
  window.location.reload();
});

export { db };
