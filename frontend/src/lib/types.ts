export type Role = "admin" | "supervisor" | "kasir";

export type User = {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
};

export type UserListResponse = {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type Category = {
  id: number;
  name: string;
  description: string | null;
};

export type CategoryListResponse = {
  items: Category[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type CategoryBulkRowError = {
  row: number;
  name: string | null;
  message: string;
};

export type CategoryBulkResult = {
  total_rows: number;
  created: number;
  errors: CategoryBulkRowError[];
};

export type Unit = {
  id: number;
  name: string;
  abbreviation: string | null;
};

export type UnitListResponse = {
  items: Unit[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ProductUnit = {
  id: number;
  unit_id: number;
  conversion: number;
  buy_price: number;
  sell_price: number;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  category_id: number;
  base_unit_id: number;
  min_stock: number;
  stock: number;
  is_active: boolean;
  units: ProductUnit[];
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ProductImportRowError = {
  row: number;
  product_name: string | null;
  message: string;
};

export type ProductImportResult = {
  total_rows: number;
  created: number;
  errors: ProductImportRowError[];
};

export type StoreSetting = {
  id: number;
  store_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  receipt_paper_size: string;
  receipt_footer: string;
  transaction_number_format: string;
};

export type StockMovementType = "in" | "out" | "adjustment";

export type StockMovement = {
  id: number;
  product_id: number;
  unit_id: number;
  type: StockMovementType;
  qty_input: number;
  qty_base: number;
  note: string | null;
  created_by_id: number;
  created_at: string;
};

export type PaymentMethod = "cash" | "debit" | "credit" | "qris" | "transfer" | "other";

export type SaleItem = {
  id: number;
  product_id: number;
  unit_id: number;
  qty: number;
  conversion: number;
  sell_price: number;
  buy_price: number;
  subtotal: number;
};

export type Sale = {
  id: number;
  invoice_number: string;
  cashier_id: number;
  cashier: User;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  change_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  items: SaleItem[];
};

export type SalesReportRow = {
  date: string;
  total_sales: number;
  total_transactions: number;
};

export type TopProductRow = {
  product_id: number;
  product_name: string;
  qty_sold_base: number;
  total_sales: number;
};

export type ProfitReportRow = {
  date: string;
  total_profit: number;
};

export type LowStockRow = {
  product_id: number;
  name: string;
  stock: number;
  min_stock: number;
};

export type StockValueRow = {
  product_id: number;
  name: string;
  stock: number;
  buy_price_base: number;
  value: number;
};

export type DashboardSummary = {
  sales_today: number;
  profit_today: number;
  product_count: number;
  total_stock: number;
  low_stock_count: number;
  transactions_today: number;
  sales_trend: SalesReportRow[];
  low_stock_items: LowStockRow[];
  top_products: TopProductRow[];
};
