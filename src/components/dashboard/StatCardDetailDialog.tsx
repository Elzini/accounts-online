import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Car, ShoppingCart, DollarSign, TrendingUp, Calculator, Minus, Plus, Equal } from 'lucide-react';

interface BreakdownItem {
  label: string;
  value: number;
  type?: 'add' | 'subtract' | 'total';
  description?: string;
}

interface StatDetailData {
  title: string;
  value: string | number;
  subtitle?: string;
  breakdown: BreakdownItem[];
  formula?: string;
  notes?: string[];
}

interface StatCardDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: StatDetailData | null;
}

export function StatCardDetailDialog({ open, onOpenChange, data }: StatCardDetailDialogProps) {
  if (!data) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5 text-primary" />
            تفاصيل: {data.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Value */}
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">القيمة الحالية</p>
            <p className="text-3xl font-bold text-primary">{data.value}</p>
            {data.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{data.subtitle}</p>
            )}
          </div>

          {/* Breakdown */}
          {data.breakdown.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                تفاصيل الحساب
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {data.breakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {item.type === 'add' && (
                        <Plus className="w-4 h-4 text-success shrink-0" />
                      )}
                      {item.type === 'subtract' && (
                        <Minus className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      {item.type === 'total' && (
                        <Equal className="w-4 h-4 text-primary shrink-0" />
                      )}
                      {!item.type && <div className="w-4" />}
                      <span className={`text-sm truncate ${item.type === 'total' ? 'font-bold' : ''}`}>
                        {item.label}
                      </span>
                    </div>
                    <span className={`text-sm font-mono shrink-0 ${
                      item.type === 'add' ? 'text-success' : 
                      item.type === 'subtract' ? 'text-destructive' : 
                      item.type === 'total' ? 'font-bold text-primary' : ''
                    }`}>
                      {typeof item.value === 'number' && item.value !== Math.floor(item.value) 
                        ? formatCurrency(item.value) 
                        : formatNumber(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formula */}
          {data.formula && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                معادلة الحساب
              </h4>
              <div className="bg-accent/50 rounded-lg p-3">
                <code className="text-sm text-foreground/80 whitespace-pre-wrap font-mono">
                  {data.formula}
                </code>
              </div>
            </div>
          )}

          {/* Notes */}
          {data.notes && data.notes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">ملاحظات</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {data.notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { StatDetailData, BreakdownItem };
