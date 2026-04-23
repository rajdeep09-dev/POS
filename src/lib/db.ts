import Dexie, { type EntityTable } from 'dexie';

/**
 * Enterprise Schema V18.0 (Production SaaS)
 * Full offline-first support for 25+ advanced retail features.
 */

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  image_url?: string;
  tax_rate: number;
  hsn_code?: string;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Variant {
  id: string;
  tenant_id: string;
  product_id: string;
  size: string;
  unit: 'pcs' | 'kg' | 'ltr' | 'box';
  stock: number;
  low_stock_threshold: number;
  dented_stock: number;
  cost_price: number;
  msp: number;
  base_price: number;
  barcode?: string;
  batch_no?: string;
  expiry_date?: string;
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

export interface Shift {
  id: string;
  tenant_id: string;
  branch_id?: string;
  user_id: string;
  opened_at: string;
  closed_at?: string;
  starting_cash: number;
  expected_cash: number;
  actual_cash?: number;
  notes?: string;
  status: 'open' | 'closed';
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Sale {
  id: string;
  tenant_id: string;
  branch_id?: string;
  shift_id?: string;
  invoice_no: string;
  total_amount: number;
  tax_amount: number;
  discount: number;
  cash_amount: number;
  upi_amount: number;
  card_amount: number;
  payment_method: string;
  customer_id?: string;
  date: string;
  status: 'completed' | 'refunded' | 'void';
  is_returned?: number;
  return_date?: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface SaleItem {
  id: string;
  tenant_id: string;
  sale_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
  is_returned?: number;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  balance: number;
  credit_limit: number;
  loyalty_points: number;
  status: 'active' | 'blocked' | 'Overdue' | 'Clear';
  last_tx?: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  gstin?: string;
  balance: number;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Expense {
  id: string;
  tenant_id: string;
  branch_id?: string;
  shift_id?: string;
  category: string;
  amount: number;
  payment_method: string;
  notes?: string;
  date: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  sync_status: 'pending' | 'synced';
}

export interface KhataTransaction {
  id: string;
  tenant_id: string;
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
  tenant_id: string;
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
  tenant_id: string;
  type: 'gst' | 'eway';
  bill_no: string;
  date: string;
  customer_name: string;
  data: any; 
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced';
  version_clock: number;
}

export interface ParkedCart {
  id: string;
  tenant_id: string;
  customer_name?: string;
  items: any[];
  total: number;
  created_at: string;
}

const db = new Dexie('VyaparSyncDB') as Dexie & {
  products: EntityTable<Product, 'id'>;
  variants: EntityTable<Variant, 'id'>;
  shifts: EntityTable<Shift, 'id'>;
  sales: EntityTable<Sale, 'id'>;
  sale_items: EntityTable<SaleItem, 'id'>;
  customers: EntityTable<Customer, 'id'>;
  suppliers: EntityTable<Supplier, 'id'>;
  expenses: EntityTable<Expense, 'id'>;
  audit_logs: EntityTable<AuditLog, 'id'>;
  khata_transactions: EntityTable<KhataTransaction, 'id'>;
  bills: EntityTable<Bill, 'id'>;
  digital_bills: EntityTable<DigitalBill, 'id'>;
  parked_carts: EntityTable<ParkedCart, 'id'>;
  categories: EntityTable<Category, 'id'>;
};

// V18.0: Production SaaS Schema Refactor
db.version(18).stores({
  products: 'id, tenant_id, name, category, tax_rate, updated_at, is_deleted, sync_status, version_clock', 
  variants: 'id, tenant_id, product_id, barcode, batch_no, low_stock_threshold, updated_at, is_deleted, sync_status, version_clock', 
  shifts: 'id, tenant_id, user_id, status, opened_at, sync_status, version_clock',
  sales: 'id, tenant_id, shift_id, invoice_no, date, status, updated_at, is_deleted, sync_status, version_clock',
  sale_items: 'id, tenant_id, sale_id, variant_id, updated_at, is_deleted, sync_status, version_clock',
  customers: 'id, tenant_id, name, phone, loyalty_points, updated_at, is_deleted, sync_status, version_clock',
  suppliers: 'id, tenant_id, name, updated_at, is_deleted, sync_status, version_clock',
  expenses: 'id, tenant_id, shift_id, category, date, updated_at, is_deleted, sync_status, version_clock',
  audit_logs: 'id, tenant_id, user_id, action, created_at, sync_status',
  khata_transactions: 'id, tenant_id, customer_id, date, sync_status, updated_at, is_deleted, version_clock',
  bills: 'id, tenant_id, supplier, status, updated_at, is_deleted, sync_status, version_clock',
  digital_bills: 'id, tenant_id, type, bill_no, customer_name, date, sync_status, updated_at, is_deleted, version_clock',
  categories: 'id, tenant_id, name, updated_at, is_deleted, sync_status, version_clock',
  parked_carts: 'id, tenant_id, created_at'
});

db.on('versionchange', function() {
  db.close();
  window.location.reload();
});

export { db };
