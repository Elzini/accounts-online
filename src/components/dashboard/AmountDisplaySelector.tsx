import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';

export type AmountDisplayMode = 'base' | 'vat' | 'total';

interface AmountDisplaySelectorProps {
  value: AmountDisplayMode;
  onChange: (value: AmountDisplayMode) => void;
}

export function AmountDisplaySelector({ value, onChange }: AmountDisplaySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calculator className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={value} onValueChange={(v) => onChange(v as AmountDisplayMode)}>
        <SelectTrigger className="w-[140px] sm:w-[180px] h-9 text-xs sm:text-sm">
          <SelectValue placeholder="عرض المبلغ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="base">المبلغ الأساسي</SelectItem>
          <SelectItem value="vat">الضريبة فقط</SelectItem>
          <SelectItem value="total">شامل الضريبة</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Utility function to calculate amounts based on display mode
// Note: Stored amounts are the ACTUAL sale/purchase prices (VAT-inclusive)
export function calculateDisplayAmount(storedAmount: number, mode: AmountDisplayMode): number {
  const VAT_DIVISOR = 1.15;
  
  switch (mode) {
    case 'base':
      // Extract base amount (remove VAT)
      return storedAmount / VAT_DIVISOR;
    case 'vat':
      // Calculate VAT portion only
      return storedAmount - (storedAmount / VAT_DIVISOR);
    case 'total':
    default:
      // Return as-is (stored amount is already VAT-inclusive)
      return storedAmount;
  }
}

// Get display label for the mode
export function getDisplayModeLabel(mode: AmountDisplayMode): string {
  switch (mode) {
    case 'base':
      return 'بدون ضريبة';
    case 'vat':
      return 'الضريبة';
    case 'total':
    default:
      return 'شامل الضريبة';
  }
}
