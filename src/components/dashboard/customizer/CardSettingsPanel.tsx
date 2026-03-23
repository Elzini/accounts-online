/**
 * Card Settings Panel - Right side of DashboardCustomizer
 * Extracted from DashboardCustomizer.tsx
 */

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Palette, Type, Plus, RotateCcw, Check, TrendingUp,
  Search, Calculator, Database, X, Ruler, Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccounts } from '@/hooks/useAccounting';
import {
  CardConfig, FormulaAccountItem,
  CARD_COLORS, TEXT_COLORS, TREND_COLORS, GRADIENT_PRESETS, DEFAULT_STAT_CARDS,
} from './types';

interface CardSettingsPanelProps {
  selected: CardConfig | undefined;
  updateCard: (id: string, updates: Partial<CardConfig>) => void;
  toggleVisibility: (id: string) => void;
  applyStyleToAll: (sourceId: string) => void;
  industryLabels: { availableItems: string; totalPurchasesLabel: string };
  accountSearch: string;
  setAccountSearch: (v: string) => void;
}

const normalizeArabic = (text: string) => {
  return text
    .replace(/[\u0610-\u065f\u0670\u06D6-\u06ED]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ئؤ]/g, 'ء')
    .replace(/ى/g, 'ي')
    .toLowerCase();
};

export function CardSettingsPanel({
  selected, updateCard, toggleVisibility, applyStyleToAll,
  industryLabels, accountSearch, setAccountSearch,
}: CardSettingsPanelProps) {
  const { t } = useLanguage();
  const { data: accounts = [] } = useAccounts();

  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return accounts.slice(0, 50);
    const q = normalizeArabic(accountSearch.trim());
    const qRaw = accountSearch.trim();
    return accounts.filter(a => {
      if (normalizeArabic(a.name).includes(q)) return true;
      if (a.code.startsWith(qRaw) || a.code.includes(qRaw)) return true;
      if (/^\d+$/.test(qRaw) && a.code.startsWith(qRaw)) return true;
      return false;
    });
  }, [accounts, accountSearch]);

  if (!selected) {
    return (
      <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
        <Palette className="w-12 h-12 mb-3 opacity-30" />
        <p>{t.select_card_hint}</p>
        <p className="text-xs mt-1">{t.to_customize}</p>
      </div>
    );
  }

  return (
    <div key={selected.id} className="border rounded-lg p-4 space-y-5">
      {/* Editable Card Name */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Type className="w-4 h-4" />
          {t.card_name_label}
        </Label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={selected.label}
            onChange={(e) => updateCard(selected.id, { label: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            dir="rtl"
            placeholder={t.card_name_placeholder}
          />
          <Button
            variant="ghost" size="sm" className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              const defaultCard = DEFAULT_STAT_CARDS.find(c => c.id === selected.id);
              if (defaultCard) {
                const defaultLabel = defaultCard.id === 'availableCars'
                  ? industryLabels.availableItems
                  : defaultCard.id === 'totalPurchases'
                    ? industryLabels.totalPurchasesLabel
                    : defaultCard.label;
                updateCard(selected.id, { label: defaultLabel });
              }
            }}
            title={t.restore_default_name}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">{t.card_name_hint}</p>
      </div>

      {/* Data Source */}
      <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Database className="w-4 h-4" />
          مصدر البيانات
        </Label>
        <Tabs
          value={selected.dataSource || 'default'}
          onValueChange={(v) => updateCard(selected.id, {
            dataSource: v as CardConfig['dataSource'],
            ...(v === 'default' ? { accountId: undefined, formulaAccounts: undefined } : {}),
          })}
          dir="rtl"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="default" className="text-xs">افتراضي</TabsTrigger>
            <TabsTrigger value="account" className="text-xs gap-1"><Database className="w-3 h-3" />حساب</TabsTrigger>
            <TabsTrigger value="formula" className="text-xs gap-1"><Calculator className="w-3 h-3" />معادلة</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-3 space-y-2">
            <div className="relative">
              <Search className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="ابحث بالاسم أو رقم الحساب..." value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} className="pr-8 text-sm" dir="rtl" />
            </div>
            {selected.accountId && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                <span className="text-xs font-medium flex-1 truncate">
                  {accounts.find(a => a.id === selected.accountId)?.code} - {accounts.find(a => a.id === selected.accountId)?.name}
                </span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateCard(selected.id, { accountId: undefined })}><X className="w-3 h-3" /></Button>
              </div>
            )}
            <ScrollArea className="max-h-[150px] border rounded-md">
              <div className="p-1 space-y-0.5">
                {filteredAccounts.map(acc => (
                  <button key={acc.id} onClick={() => { updateCard(selected.id, { accountId: acc.id }); setAccountSearch(''); }}
                    className={cn('w-full text-right px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors flex items-center gap-2', selected.accountId === acc.id && 'bg-primary/10 font-medium')}>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">{acc.code}</Badge>
                    <span className="truncate">{acc.name}</span>
                  </button>
                ))}
                {filteredAccounts.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">لا توجد نتائج</p>}
              </div>
            </ScrollArea>
            <p className="text-[10px] text-muted-foreground">سيتم عرض رصيد الحساب المحدد في البطاقة</p>
          </TabsContent>

          <TabsContent value="formula" className="mt-3 space-y-3">
            <p className="text-[10px] text-muted-foreground">اختر حسابات وحدد العملية (+ أو -) لبناء معادلة حسابية</p>
            {(selected.formulaAccounts || []).length > 0 && (
              <div className="space-y-1.5">
                {(selected.formulaAccounts || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-md bg-accent/50 border text-xs">
                    <Badge variant={item.operator === '+' ? 'default' : 'destructive'} className="text-[10px] px-1.5 shrink-0">{item.operator}</Badge>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">{item.accountCode}</Badge>
                    <span className="truncate flex-1">{item.accountName}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => {
                      const updated = [...(selected.formulaAccounts || [])];
                      updated.splice(idx, 1);
                      updateCard(selected.id, { formulaAccounts: updated });
                    }}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
                <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  المعادلة: {(selected.formulaAccounts || []).map((item, i) => `${i === 0 && item.operator === '+' ? '' : item.operator} ${item.accountName}`).join(' ')}
                </div>
              </div>
            )}
            <div className="relative">
              <Search className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="ابحث بالاسم أو رقم الحساب..." value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} className="pr-8 text-sm" dir="rtl" />
            </div>
            <ScrollArea className="max-h-[120px] border rounded-md">
              <div className="p-1 space-y-0.5">
                {filteredAccounts.map(acc => (
                  <div key={acc.id} className="flex items-center gap-1 px-1 py-1 rounded text-xs hover:bg-accent transition-colors">
                    <Button variant="outline" size="icon" className="h-5 w-5 shrink-0 text-success border-success/30 hover:bg-success/10"
                      onClick={() => { updateCard(selected.id, { formulaAccounts: [...(selected.formulaAccounts || []), { accountId: acc.id, accountName: acc.name, accountCode: acc.code, operator: '+' }] }); setAccountSearch(''); }}>
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-5 w-5 shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => { updateCard(selected.id, { formulaAccounts: [...(selected.formulaAccounts || []), { accountId: acc.id, accountName: acc.name, accountCode: acc.code, operator: '-' }] }); setAccountSearch(''); }}>
                      <span className="text-sm font-bold">−</span>
                    </Button>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">{acc.code}</Badge>
                    <span className="truncate">{acc.name}</span>
                  </div>
                ))}
                {filteredAccounts.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">لا توجد نتائج</p>}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="default" className="mt-2">
            <p className="text-[10px] text-muted-foreground">سيتم استخدام القيمة الافتراضية للبطاقة</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <Label className="text-sm">{t.size_label}</Label>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map(size => (
            <Button key={size} variant={selected.size === size ? 'default' : 'outline'} size="sm" className="flex-1"
              onClick={() => updateCard(selected.id, { size })}>
              {size === 'small' ? t.size_small : size === 'large' ? t.size_large : t.size_medium}
            </Button>
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-sm">{t.bg_color_label}</Label>
        <div className="flex flex-wrap gap-2">
          {CARD_COLORS.map(color => (
            <button key={color.value || 'default'} onClick={() => updateCard(selected.id, { bgColor: color.value })}
              className={cn('w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center',
                (selected.bgColor || '') === color.value ? 'ring-2 ring-primary ring-offset-2' : 'border-border hover:border-primary/50')}
              style={{ backgroundColor: color.value || 'hsl(var(--card))' }} title={color.label}>
              {(selected.bgColor || '') === color.value && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2"><Type className="w-4 h-4" />{t.text_color_label}</Label>
        <div className="flex flex-wrap gap-2">
          {TEXT_COLORS.map(color => (
            <button key={color.value || 'default-text'} onClick={() => updateCard(selected.id, { textColor: color.value })}
              className={cn('w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center',
                (selected.textColor || '') === color.value ? 'ring-2 ring-primary ring-offset-2' : 'border-border hover:border-primary/50')}
              style={{ backgroundColor: color.value || 'hsl(var(--card))' }} title={color.label}>
              {(selected.textColor || '') === color.value && <Check className="w-4 h-4" style={{ color: color.value === '#000000' || color.value === '#1e293b' ? '#fff' : '#000' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Gradient Presets */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2"><Palette className="w-4 h-4" />{t.gradient_colors}</Label>
        <div className="grid grid-cols-4 gap-2">
          {GRADIENT_PRESETS.map((preset, i) => {
            const isSelected = (selected.gradientFrom || '') === preset.from && (selected.gradientTo || '') === preset.to;
            return (
              <button key={i} onClick={() => updateCard(selected.id, { gradientFrom: preset.from, gradientTo: preset.to, bgColor: preset.from ? '' : selected.bgColor })}
                className={cn('h-8 rounded-lg border-2 transition-all flex items-center justify-center', isSelected ? 'ring-2 ring-primary ring-offset-2' : 'border-border hover:border-primary/50')}
                style={{ background: preset.from ? `linear-gradient(135deg, ${preset.from}, ${preset.to})` : 'hsl(var(--card))' }} title={preset.label}>
                {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm flex items-center gap-2"><Type className="w-4 h-4" />{t.font_size_label}</Label>
          <span className="text-sm text-muted-foreground">{selected.fontSize || 100}%</span>
        </div>
        <Slider value={[selected.fontSize || 100]} onValueChange={([v]) => updateCard(selected.id, { fontSize: v })} min={70} max={130} step={5} className="w-full" />
      </div>

      {/* Card Height */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm flex items-center gap-2"><Ruler className="w-4 h-4" />{t.card_height_label}</Label>
          <span className="text-sm text-muted-foreground">{selected.height ? `${selected.height}px` : t.auto_label}</span>
        </div>
        <Slider value={[selected.height || 0]} onValueChange={([v]) => updateCard(selected.id, { height: v === 0 ? undefined : v })} min={0} max={300} step={10} className="w-full" />
        <p className="text-xs text-muted-foreground">{t.auto_height_hint}</p>
      </div>

      {/* Card Width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm flex items-center gap-2"><Ruler className="w-4 h-4" />{t.card_width_label}</Label>
          <span className="text-sm text-muted-foreground">{selected.width ? `${selected.width}px` : t.auto_label}</span>
        </div>
        <Slider value={[selected.width || 0]} onValueChange={([v]) => updateCard(selected.id, { width: v === 0 ? undefined : v })} min={0} max={500} step={10} className="w-full" />
        <p className="text-xs text-muted-foreground">{t.auto_width_hint}</p>
      </div>

      {/* 3D Effect */}
      <div className="flex items-center justify-between">
        <Label className="text-sm flex items-center gap-2"><Box className="w-4 h-4" />{t.effect_3d_label}</Label>
        <Switch checked={selected.enable3D || false} onCheckedChange={(checked) => updateCard(selected.id, { enable3D: checked })} />
      </div>

      {/* Trend Visibility */}
      <div className="flex items-center justify-between">
        <Label className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" />{t.show_trend_label}</Label>
        <Switch checked={selected.showTrend ?? true} onCheckedChange={(checked) => updateCard(selected.id, { showTrend: checked })} />
      </div>

      {/* Trend Color */}
      {(selected.showTrend ?? true) && (
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" />{t.trend_color_label}</Label>
          <div className="flex flex-wrap gap-2">
            {TREND_COLORS.map(color => (
              <button key={color.value || 'default-trend'} onClick={() => updateCard(selected.id, { trendColor: color.value })}
                className={cn('w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center',
                  (selected.trendColor || '') === color.value ? 'ring-2 ring-primary ring-offset-2' : 'border-border hover:border-primary/50')}
                style={{ backgroundColor: color.value || 'hsl(var(--card))' }} title={color.label}>
                {(selected.trendColor || '') === color.value && <Check className="w-4 h-4" style={{ color: ['#000000', '#1e293b'].includes(color.value) ? '#fff' : '#000' }} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visibility */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">{t.show_card_label}</Label>
        <Switch checked={selected.visible} onCheckedChange={() => toggleVisibility(selected.id)} />
      </div>

      {/* Apply to All */}
      <Button variant="outline" size="sm" className="w-full gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/10" onClick={() => applyStyleToAll(selected.id)}>
        <Palette className="w-4 h-4" />{t.apply_style_all}
      </Button>

      {/* Preview */}
      <div className="pt-3 border-t">
        <Label className="text-sm mb-2 block">{t.preview_label}</Label>
        <div
          className={cn('rounded-xl p-4 border transition-all overflow-hidden', selected.size === 'small' && 'text-xs', selected.size === 'large' && 'text-lg')}
          style={{
            background: selected.gradientFrom && selected.gradientTo
              ? `linear-gradient(135deg, ${selected.gradientFrom}, ${selected.gradientTo})`
              : selected.bgColor || 'hsl(var(--card))',
            fontSize: `${(selected.fontSize || 100) / 100}em`,
            height: selected.height ? `${selected.height}px` : undefined,
            color: selected.textColor || undefined,
            transform: selected.enable3D ? 'perspective(1000px) rotateX(-3deg) rotateY(3deg)' : undefined,
            boxShadow: selected.enable3D ? '-4px 8px 25px rgba(0,0,0,0.2), -2px 3px 8px rgba(0,0,0,0.1)' : undefined,
          }}
        >
          <p className="opacity-75 text-[0.75em] mb-1" style={{ color: selected.textColor || undefined }}>{selected.label}</p>
          <p className="font-bold text-[1.5em]" style={{ color: selected.textColor || undefined }}>123,456</p>
          <p className="opacity-60 text-[0.7em]" style={{ color: selected.textColor || undefined }}>{t.currency_sar_label}</p>
        </div>
      </div>
    </div>
  );
}
