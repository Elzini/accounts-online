// سجل تدقيق عمليات استيراد ميزان المراجعة
// يتتبع جميع عمليات الاستيراد والتعديل والتوليد

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  details: string;
  user?: string;
  metadata?: Record<string, any>;
}

export type AuditAction =
  | 'file_uploaded'
  | 'file_parsed'
  | 'mapping_changed'
  | 'missing_accounts_added'
  | 'validation_run'
  | 'statements_generated'
  | 'branch_selected'
  | 'currency_changed'
  | 'data_cleared'
  | 'export_pdf'
  | 'export_excel'
  | 'system_calculation'
  | 'medad_import';

const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  file_uploaded: 'رفع ملف',
  file_parsed: 'تحليل الملف',
  mapping_changed: 'تعديل تصنيف حساب',
  missing_accounts_added: 'إضافة حسابات مفقودة',
  validation_run: 'تشغيل الفحص',
  statements_generated: 'توليد القوائم المالية',
  branch_selected: 'تحديد الفرع',
  currency_changed: 'تغيير العملة',
  data_cleared: 'مسح البيانات',
  export_pdf: 'تصدير PDF',
  export_excel: 'تصدير Excel',
  system_calculation: 'حساب من النظام',
  medad_import: 'استيراد من مداد',
};

export function getActionLabel(action: AuditAction): string {
  return AUDIT_ACTION_LABELS[action] || action;
}

// إنشاء سجل تدقيق محلي (في الذاكرة)
export function createAuditLog(): {
  entries: AuditLogEntry[];
  addEntry: (action: AuditAction, details: string, metadata?: Record<string, any>) => void;
  clear: () => void;
  getEntries: () => AuditLogEntry[];
} {
  const entries: AuditLogEntry[] = [];

  return {
    entries,
    addEntry(action, details, metadata) {
      entries.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        action,
        details,
        metadata,
      });
    },
    clear() {
      entries.length = 0;
    },
    getEntries() {
      return [...entries];
    },
  };
}

// تنسيق الوقت للعرض
export function formatAuditTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatAuditDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}
