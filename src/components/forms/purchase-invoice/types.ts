export interface CarItem {
  id: string;
  chassis_number: string;
  plate_number: string;
  name: string;
  model: string;
  color: string;
  purchase_price: string;
  quantity: number;
  unit: string;
  car_condition: 'new' | 'used';
}

export interface PurchaseInventoryItem {
  id: string;
  item_id: string | null;
  item_name: string;
  barcode: string;
  unit_name: string;
  unit_id: string | null;
  purchase_price: string;
  quantity: number;
}

export interface PurchaseInvoiceData {
  invoice_number: string;
  supplier_id: string;
  purchase_date: string;
  due_date: string;
  payment_account_id: string;
  warehouse: string;
  notes: string;
  price_includes_tax: boolean;
  project_id: string | null;
  cost_center_id: string | null;
  payment_status: string;
  supplier_invoice_number: string;
}
