import { TaxSettings } from '@/services/accounting';

export interface InvoiceTemplateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount?: number;
  total: number;
}

export interface InvoiceTemplateData {
  invoiceNumber: string | number;
  invoiceDate: string;
  invoiceType: 'sale' | 'purchase';
  // Seller
  sellerName: string;
  sellerTaxNumber?: string;
  sellerAddress?: string;
  sellerPhone?: string;
  sellerCommercialRegister?: string;
  // Buyer
  buyerName: string;
  buyerPhone?: string;
  buyerAddress?: string;
  buyerTaxNumber?: string;
  buyerIdNumber?: string;
  // Items
  items: InvoiceTemplateItem[];
  // Totals
  subtotal: number;
  discountAmount?: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  // Settings
  taxSettings?: TaxSettings | null;
  companyLogoUrl?: string | null;
  uuid?: string;
  // Extra
  branchName?: string;
  salesmanName?: string;
  paymentMethod?: string;
}

export type InvoiceTemplateName = 'template1' | 'template2' | 'template3' | 'template4' | 'default';
