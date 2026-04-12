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
  voucherNumber?: string | number;
  notes?: string;
  buyerCommercialRegister?: string;
  poDetails?: string;
  projectReference?: string;
  customLabels?: InvoiceCustomLabels;
}

export interface InvoiceCustomLabels {
  invoiceTitle?: string;
  invoiceTitleEn?: string;
  descriptionColumn?: string;
  quantityColumn?: string;
  priceColumn?: string;
  totalColumn?: string;
  taxColumn?: string;
  subtotalLabel?: string;
  taxLabel?: string;
  grandTotalLabel?: string;
  sellerLabel?: string;
  sellerLabelEn?: string;
  buyerLabel?: string;
  buyerLabelEn?: string;
  plateNumberLabel?: string;
  plateNumberLabelEn?: string;
}

export const defaultInvoiceLabels: InvoiceCustomLabels = {
  invoiceTitle: 'فاتورة ضريبية',
  invoiceTitleEn: 'Tax Invoice',
  descriptionColumn: 'البيان',
  quantityColumn: 'الكمية',
  priceColumn: 'السعر',
  totalColumn: 'الإجمالي',
  taxColumn: 'الضريبة',
  subtotalLabel: 'الإجمالي غير شامل الضريبة',
  taxLabel: 'ضريبة القيمة المضافة',
  grandTotalLabel: 'الإجمالي شامل الضريبة',
  sellerLabel: 'البائع',
  sellerLabelEn: 'Seller',
  buyerLabel: 'المشتري',
  buyerLabelEn: 'Buyer',
  plateNumberLabel: 'رقم اللوحة',
  plateNumberLabelEn: 'Plate Number',
};

export type InvoiceTemplateName = 'template1' | 'template2' | 'template3' | 'template4' | 'template5' | 'default';
