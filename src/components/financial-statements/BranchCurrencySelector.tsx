// مكون اختيار الفرع والعملة للقوائم المالية
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GitBranch, Coins } from 'lucide-react';

// === الفروع ===
export interface Branch {
  id: string;
  name: string;
  code?: string;
}

const DEFAULT_BRANCHES: Branch[] = [
  { id: 'all', name: 'جميع الفروع (موحد)', code: 'ALL' },
  { id: 'main', name: 'الفرع الرئيسي', code: 'MAIN' },
];

// === العملات ===
export interface CurrencyConfig {
  code: string;
  nameAr: string;
  symbol: string;
  rate: number; // سعر الصرف مقابل الريال السعودي
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'SAR', nameAr: 'ريال سعودي', symbol: 'ر.س', rate: 1 },
  { code: 'USD', nameAr: 'دولار أمريكي', symbol: '$', rate: 0.2667 },
  { code: 'EUR', nameAr: 'يورو', symbol: '€', rate: 0.2445 },
  { code: 'GBP', nameAr: 'جنيه إسترليني', symbol: '£', rate: 0.2100 },
  { code: 'AED', nameAr: 'درهم إماراتي', symbol: 'د.إ', rate: 0.9795 },
  { code: 'KWD', nameAr: 'دينار كويتي', symbol: 'د.ك', rate: 0.0818 },
  { code: 'BHD', nameAr: 'دينار بحريني', symbol: 'د.ب', rate: 0.1005 },
  { code: 'QAR', nameAr: 'ريال قطري', symbol: 'ر.ق', rate: 0.9709 },
  { code: 'OMR', nameAr: 'ريال عماني', symbol: 'ر.ع', rate: 0.1027 },
  { code: 'EGP', nameAr: 'جنيه مصري', symbol: 'ج.م', rate: 13.25 },
  { code: 'JOD', nameAr: 'دينار أردني', symbol: 'د.أ', rate: 0.1890 },
];

// تحويل مبلغ من الريال السعودي إلى عملة أخرى
export function convertAmount(amountSAR: number, targetCurrency: CurrencyConfig): number {
  return amountSAR * targetCurrency.rate;
}

// تنسيق مبلغ بالعملة المحددة
export function formatCurrencyAmount(amount: number, currency: CurrencyConfig): string {
  return `${new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ${currency.symbol}`;
}

// === المكونات ===

interface BranchSelectorProps {
  branches: Branch[];
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  customBranches?: Branch[];
}

export function BranchSelector({ branches, selectedBranch, onBranchChange, customBranches }: BranchSelectorProps) {
  const allBranches = [...DEFAULT_BRANCHES, ...(customBranches || []), ...branches.filter(b => !DEFAULT_BRANCHES.some(d => d.id === b.id))];

  return (
    <div className="flex items-center gap-2">
      <GitBranch className="w-4 h-4 text-muted-foreground shrink-0" />
      <Select value={selectedBranch} onValueChange={onBranchChange}>
        <SelectTrigger className="h-8 text-xs w-[180px]">
          <SelectValue placeholder="اختر الفرع" />
        </SelectTrigger>
        <SelectContent>
          {allBranches.map(branch => (
            <SelectItem key={branch.id} value={branch.id} className="text-xs">
              <div className="flex items-center gap-2">
                {branch.code && <Badge variant="outline" className="text-[10px] px-1">{branch.code}</Badge>}
                {branch.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currencyCode: string) => void;
  customRate?: number;
  onCustomRateChange?: (rate: number) => void;
}

export function CurrencySelector({ selectedCurrency, onCurrencyChange, customRate, onCustomRateChange }: CurrencySelectorProps) {
  const selected = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);

  return (
    <div className="flex items-center gap-2">
      <Coins className="w-4 h-4 text-muted-foreground shrink-0" />
      <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
        <SelectTrigger className="h-8 text-xs w-[180px]">
          <SelectValue placeholder="اختر العملة" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map(currency => (
            <SelectItem key={currency.code} value={currency.code} className="text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono">{currency.symbol}</span>
                {currency.nameAr}
                {currency.code !== 'SAR' && (
                  <span className="text-muted-foreground text-[10px]">({currency.rate})</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && selected.code !== 'SAR' && onCustomRateChange && (
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">سعر الصرف:</Label>
          <Input
            type="number"
            step="0.0001"
            value={customRate ?? selected.rate}
            onChange={e => onCustomRateChange(parseFloat(e.target.value) || selected.rate)}
            className="h-7 w-20 text-xs"
          />
        </div>
      )}
    </div>
  );
}

// مكون مدمج للفرع والعملة
interface BranchCurrencyBarProps {
  branches: Branch[];
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  selectedCurrency: string;
  onCurrencyChange: (currencyCode: string) => void;
  customRate?: number;
  onCustomRateChange?: (rate: number) => void;
}

export function BranchCurrencyBar({
  branches,
  selectedBranch,
  onBranchChange,
  selectedCurrency,
  onCurrencyChange,
  customRate,
  onCustomRateChange,
}: BranchCurrencyBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-2 bg-muted/30 rounded-lg">
      <BranchSelector
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={onBranchChange}
      />
      <div className="h-5 w-px bg-border" />
      <CurrencySelector
        selectedCurrency={selectedCurrency}
        onCurrencyChange={onCurrencyChange}
        customRate={customRate}
        onCustomRateChange={onCustomRateChange}
      />
      {selectedCurrency !== 'SAR' && (
        <Badge variant="outline" className="text-[10px] gap-1">
          <Coins className="w-3 h-3" />
          محوّل
        </Badge>
      )}
    </div>
  );
}
