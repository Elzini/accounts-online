import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type AmountDisplayMode = 'base' | 'vat' | 'total';

interface AmountDisplaySelectorProps {
  value: AmountDisplayMode;
  onChange: (value: AmountDisplayMode) => void;
}

export function AmountDisplaySelector({ value, onChange }: AmountDisplaySelectorProps) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2">
      <Calculator className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={value} onValueChange={(v) => onChange(v as AmountDisplayMode)}>
        <SelectTrigger className="w-[140px] sm:w-[180px] h-9 text-xs sm:text-sm">
          <SelectValue placeholder={t.display_amounts} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="base">{t.amount_base}</SelectItem>
          <SelectItem value="vat">{t.amount_vat_only}</SelectItem>
          <SelectItem value="total">{t.amount_total}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Utility function to calculate amounts based on display mode
export function calculateDisplayAmount(storedAmount: number, mode: AmountDisplayMode): number {
  const VAT_DIVISOR = 1.15;
  switch (mode) {
    case 'base':
      return storedAmount / VAT_DIVISOR;
    case 'vat':
      return storedAmount - (storedAmount / VAT_DIVISOR);
    case 'total':
    default:
      return storedAmount;
  }
}

// These need language context so we use a hook-compatible approach
// For static usage, we provide both ar/en
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
