/**
 * Shared Invoice Totals Section
 * Color-coded result boxes for subtotal, discount, tax, total, and optionally profit.
 */
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InvoiceTotalsSectionProps {
  subtotal: number;
  discountAmount: number;
  totalVAT: number;
  finalTotal: number;
  taxRate: number;
  currency: string;
  discount: number;
  discountType: 'percentage' | 'amount';
  onDiscountChange: (value: number) => void;
  onDiscountTypeChange: (type: 'percentage' | 'amount') => void;
  formatCurrency: (value: number) => string;
  // Sales-specific
  profit?: number;
  profitLabel?: string;
  // Purchase-specific (no profit, different total label)
  totalLabel?: string;
  // Labels
  labels: {
    subtotal: string;
    discount: string;
    tax: string;
    roundedNet?: string;
  };
}

export function InvoiceTotalsSection({
  subtotal, discountAmount, totalVAT, finalTotal, taxRate, currency,
  discount, discountType, onDiscountChange, onDiscountTypeChange,
  formatCurrency, profit, profitLabel, totalLabel, labels,
}: InvoiceTotalsSectionProps) {
  const showProfit = profit !== undefined && profitLabel;
  const profitPositive = (profit ?? 0) >= 0;

  return (
    <div className={`grid ${showProfit ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'} gap-3`}>
      {/* المجموع */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
        <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(subtotal)}</div>
        <div className="text-[10px] text-blue-600 dark:text-blue-500 font-semibold mt-1">{labels.subtotal}</div>
      </div>

      {/* الخصم */}
      <div className="bg-muted/60 border-2 border-border rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Input
            type="number"
            value={discount}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            className="h-8 text-lg font-black text-center w-20 border-0 border-b-2 border-border rounded-none bg-transparent"
            dir="ltr"
          />
          <Select value={discountType} onValueChange={(v: 'percentage' | 'amount') => onDiscountTypeChange(v)}>
            <SelectTrigger className="h-7 text-xs w-14 border-0 shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="amount">{currency}</SelectItem>
              <SelectItem value="percentage">%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-[10px] text-muted-foreground font-semibold mt-1">{labels.discount}</div>
      </div>

      {/* الضريبة */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
        <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{formatCurrency(totalVAT)}</div>
        <div className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold mt-1">{labels.tax} {taxRate}%</div>
      </div>

      {/* الربح (sales only) */}
      {showProfit && (
        <div className={`border-2 rounded-xl p-4 text-center ${profitPositive
          ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800'
          : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800'}`}
        >
          <div className={`text-2xl font-black ${profitPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(profit!)}</div>
          <div className={`text-[10px] font-semibold mt-1 ${profitPositive ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>{profitLabel}</div>
        </div>
      )}

      {/* الإجمالي */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-center">
        <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{formatCurrency(finalTotal)}</div>
        <div className="text-[10px] text-indigo-600 dark:text-indigo-500 font-semibold mt-1">{totalLabel || labels.roundedNet || 'الصافي'}</div>
      </div>
    </div>
  );
}
