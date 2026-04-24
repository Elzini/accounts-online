/**
 * AI Invoice Import - Shared Types
 */

export interface ParsedInvoiceData {
  supplier_name: string;
  supplier_branch_name?: string;
  supplier_tax_number?: string;
  supplier_phone?: string;
  supplier_address?: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal?: number;
  vat_amount?: number;
  vat_rate?: number;
  total_amount: number;
  discount?: number;
  notes?: string;
  price_includes_tax?: boolean;
}

export interface BatchParsedResult {
  index: number;
  fileName: string;
  data: ParsedInvoiceData;
  success: boolean;
  fileObject?: File;
  thumbnailUrl?: string;
}

/** سجل تنفيذ دفعة واحدة (للوحة التشخيص) */
export interface BatchTimelineEntry {
  id: string;                  // معرف فريد للسجل
  chunkNumber: number;         // ترتيب الدفعة (1, 2, 3, ...)
  startedAt: number;           // timestamp بدء الدفعة
  endedAt?: number;            // timestamp انتهاء الدفعة
  durationMs?: number;         // المدة بالميلي ثانية
  chunkSizeUsed: number;       // حجم الدفعة المُستخدم فعلياً
  fileCount: number;           // عدد الملفات في الدفعة
  attempts: number;            // عدد المحاولات
  status: 'running' | 'success' | 'failed' | 'shrunk';
  errorMessage?: string;       // رسالة الخطأ إن فشلت
  /** تغيير الحجم بعد هذه الدفعة (للتتبع البصري) */
  sizeChange?: {
    type: 'shrink' | 'grow';
    from: number;
    to: number;
    reason: string;
  };
  successCount?: number;       // عدد الفواتير الناجحة في الدفعة
  errorCount?: number;         // عدد الفواتير الفاشلة في الدفعة
}
