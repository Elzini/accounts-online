import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InvoiceTemplateName } from './templates/types';

interface InvoiceTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: InvoiceTemplateName) => void;
}

const templates: { id: InvoiceTemplateName; name: string; description: string; preview: string }[] = [
  {
    id: 'default',
    name: 'النموذج الافتراضي',
    description: 'النموذج الحالي مع تصميم عصري ملون',
    preview: '🟢',
  },
  {
    id: 'template1',
    name: 'نموذج معارض السيارات',
    description: 'فاتورة ضريبية نقدي - تصميم كلاسيكي مع تفاصيل المركبات',
    preview: '🚗',
  },
  {
    id: 'template2',
    name: 'نموذج تجاري مفصل',
    description: 'فاتورة بائع/مشتري مفصلة ثنائية اللغة مع أكواد الأصناف',
    preview: '📋',
  },
  {
    id: 'template3',
    name: 'نموذج احترافي',
    description: 'تصميم نظيف مع بيانات العميل وتفاصيل الفاتورة منفصلة',
    preview: '💼',
  },
  {
    id: 'template4',
    name: 'نموذج بسيط',
    description: 'تصميم بسيط ومباشر مع رمز QR وتفريغ بالكلمات',
    preview: '📄',
  },
  {
    id: 'template5',
    name: 'نموذج ضريبي تفصيلي',
    description: 'فاتورة ضريبية مفصلة ثنائية اللغة مع بيانات العميل والبنك وأمر الشراء',
    preview: '🏢',
  },
  {
    id: 'template6',
    name: 'نموذج المقاولات (Retention)',
    description: 'تصميم بهانس للمقاولات مع خانة الاحتجاز Retention وإجمالي مستحق',
    preview: '🏗️',
  },
  {
    id: 'template7',
    name: 'نموذج الفاتورة الضريبية التفصيلي (ZATCA)',
    description: 'فاتورة ضريبية تفصيلية ببيانات المورد والعميل والعنوان الوطني وجدول 6 أعمدة',
    preview: '🧾',
  },
];

export function InvoiceTemplateSelector({ open, onClose, onSelect }: InvoiceTemplateSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>اختر نموذج الفاتورة</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {templates.map((t) => (
            <button
              key={t.id}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 hover:border-primary/50 transition-colors text-right"
              onClick={() => { onSelect(t.id); onClose(); }}
            >
              <span className="text-2xl">{t.preview}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
