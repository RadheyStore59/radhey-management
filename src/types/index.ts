export interface Lead {
  id: string;
  lead_name: string;
  mobile_number: string;
  email: string;
  address: string;
  lead_source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  priority: 'Low' | 'Medium' | 'High';
  deal_value?: number;
  expected_close_date?: string;
  notes: string;
  date: string;
  created_at: string;
  user_id: string;
  product: string;
  contact_name: string;
  company_name: string;
  product_requirement: string;
  quantity: number;
  budget?: number;
  budget_per_piece: number;
  customization: string;
  pipeline_order?: number;
  custom_fields?: Record<string, any>;
}

export interface Sale {
  id: string; // Internal system UUID or identifier, functions implicitly as Sr.no for db purposes
  invoice_number: string;
  radhey_invoice: string;
  order_date: string;
  order_taken_date: string;
  order_ready_date: string;
  product_name: string;
  customer_name: string;
  dealer_name: string;
  phone_no: string;
  reference: string;
  deal: string;
  dispatch_date: string;
  quantity: number;
  buy_price: number;
  sell_price: number;
  profit: number;
  payment_by: string;
  payment_through: string;
  received_through_client: string;
  profit_given: string;
  remarks: string;
  created_at: string;
  user_id: string;
  phase?: 'Order Taken' | 'In Process' | 'Order Ready' | 'Dispatched' | 'Delivered';
}

export interface Inventory {
  id: string;
  product_name: string;
  product_code: string;
  category: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock_level: number;
  supplier_name: string;
  last_updated_date: string;
  created_at: string;
  user_id: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Staff';
  created_at: string;
}

export interface Gst {
  id: string;
  filing_month: string;
  filing_year: string;
  turnover?: string;
  tax_paid: string;
  due_date: string;
  filing_date: string;
  status: 'Pending' | 'Filed' | 'Late Filed' | 'Not Filed';
  remarks: string;
  created_at: string;
  user_id: string;
}

export interface Courier {
  id: string;
  date: string;
  vendor_name: string;
  particular: string;
  unit: string;
  total: string;
  payment_through: string;
  payment_by: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Refunded';
  remarks: string;
  tracking_number?: string;
  courier_company?: string;
  sender_name?: string;
  sender_phone?: string;
  sender_address?: string;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  shipment_date?: string;
  delivery_date?: string;
  weight?: string;
  cost?: string;
  created_at: string;
  user_id: string;
}

export interface Investment {
  id: string;
  sr_no: string;
  date: string;
  vendor_name: string;
  particular: string;
  unit: number;
  total: number;
  payment_through: string;
  payment_by: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Refunded';
  remarks: string;
  created_at: string;
  user_id: string;
}

export interface DashboardStats {
  totalLeads: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  totalInventoryItems: number;
  lowStockItems: number;
  totalQuantity: number;
  totalStockQuantity: number;
  totalStockValue: number;
  totalInvestmentAmount: number;
  pendingPaymentAmount: number;
  activeLeads: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}
