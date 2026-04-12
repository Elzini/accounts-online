import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { InvoiceCustomLabels, defaultInvoiceLabels } from './templates/types';

interface Props {
  labels: InvoiceCustomLabels;
  onChange: (labels: InvoiceCustomLabels) => void;
}

const labelFields: { key: keyof InvoiceCustomLabels; label: string }[] = [
  { key: 'invoiceTitle', label: 'عنوان الفاتورة (عربي)' },
  { key: 'invoiceTitleEn', label: 'عنوان الفاتورة (إنجليزي)' },
  { key: 'sellerLabel', label: 'مسمى البائع (عربي)' },
  { key: 'sellerLabelEn', label: 'مسمى البائع (إنجليزي)' },
  { key: 'buyerLabel', label: 'مسمى المشتري (عربي)' },
  { key: 'buyerLabelEn', label: 'مسمى المشتري (إنجليزي)' },
  { key: 'plateNumberLabel', label: 'مسمى رقم اللوحة (عربي)' },
  { key: 'plateNumberLabelEn', label: 'مسمى رقم اللوحة (إنجليزي)' },
  { key: 'descriptionColumn', label: 'عمود الوصف' },
  { key: 'quantityColumn', label: 'عمود الكمية' },
  { key: 'priceColumn', label: 'عمود السعر' },
  { key: 'totalColumn', label: 'عمود الإجمالي' },
  { key: 'taxColumn', label: 'عمود الضريبة' },
  { key: 'subtotalLabel', label: 'المجموع الفرعي' },
  { key: 'taxLabel', label: 'مسمى الضريبة' },
  { key: 'grandTotalLabel', label: 'الإجمالي النهائي' },
];

export function InvoiceLabelCustomizer({ labels, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const handleChange = (key: keyof InvoiceCustomLabels, value: string) => {
    onChange({ ...labels, [key]: value });
  };

  const handleReset = () => {
    onChange({ ...defaultInvoiceLabels });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between text-xs">
          <span>تخصيص مسميات الفاتورة</span>
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">تعديل الأسماء والعناوين</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={handleReset}>
              <RotateCcw className="w-3 h-3" />
              استعادة الافتراضي
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {labelFields.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{label}</Label>
                <Input
                  value={labels[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="h-7 text-xs"
                  dir="auto"
                />
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
