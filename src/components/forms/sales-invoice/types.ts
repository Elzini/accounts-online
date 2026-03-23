import { ActivePage } from '@/types';
import { CarTransfer } from '@/services/transfers';

export interface SalesInvoiceFormProps {
  setActivePage: (page: ActivePage) => void;
}

export interface SelectedCarItem {
  id: string;
  car_id: string;
  sale_price: string;
  purchase_price: number;
  car_name: string;
  model: string;
  color: string;
  chassis_number: string;
  plate_number: string;
  quantity: number;
  car_condition: 'new' | 'used';
  pendingTransfer?: CarTransfer | null;
}

export interface SelectedInventoryItem {
  id: string;
  item_id: string;
  item_name: string;
  barcode: string;
  unit_name: string;
  unit_id: string | null;
  sale_price: string;
  cost_price: number;
  quantity: number;
  available_quantity: number;
}

export interface InvoiceFormData {
  invoice_number: string;
  customer_id: string;
  sale_date: string;
  issue_time: string;
  payment_account_id: string;
  warehouse: string;
  seller_name: string;
  notes: string;
  price_includes_tax: boolean;
  commission: string;
  other_expenses: string;
  is_installment: boolean;
  down_payment: string;
  number_of_installments: string;
  last_payment_date: string;
  first_installment_date: string;
}

export interface StoredHeaderTotals {
  subtotal: number;
  vat_amount: number;
  total: number;
  vat_rate: number;
  discount_amount: number;
}
