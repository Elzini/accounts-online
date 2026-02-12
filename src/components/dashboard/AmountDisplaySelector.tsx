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

// Language-aware display mode label
export function getDisplayModeLabel(mode: AmountDisplayMode, language?: string): string {
  const isAr = language === 'ar' || language === undefined;
  switch (mode) {
    case 'base':
      return isAr ? 'بدون ضريبة' : 'Excl. VAT';
    case 'vat':
      return isAr ? 'الضريبة' : 'VAT';
    case 'total':
    default:
      return isAr ? 'شامل الضريبة' : 'Incl. VAT';
  }
}
