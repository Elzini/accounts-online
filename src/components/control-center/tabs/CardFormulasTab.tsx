import { useState, useMemo } from 'react';
import { Code2, Save, RotateCcw, Play, Variable, ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import {
  useCardFormulas,
  FORMULA_VARIABLES,
  VARIABLE_CATEGORIES,
  DEFAULT_CARD_FORMULAS,
  evaluateFormula,
  CardFormulaConfig,
} from '@/hooks/useCardFormulas';
import { useStats } from '@/hooks/useDatabase';
import { buildFormulaVariables } from '@/hooks/useCardFormulas';

// Card definitions
const CARD_DEFINITIONS = [
  { id: 'availableCars', label: 'السيارات المتاحة', icon: '🚗', type: 'count' },
  { id: 'totalPurchases', label: 'إجمالي المشتريات', icon: '🛒', type: 'currency' },
  { id: 'monthSales', label: 'مبيعات الشهر', icon: '📈', type: 'currency' },
  { id: 'totalProfit', label: 'إجمالي الأرباح', icon: '💰', type: 'currency' },
  { id: 'todaySales', label: 'مبيعات اليوم', icon: '📊', type: 'count' },
  { id: 'monthSalesCount', label: 'عدد مبيعات الشهر', icon: '🔢', type: 'count' },
];

export function CardFormulasTab() {
  const { formulas, setFormulas, saveFormulas } = useCardFormulas();
  const { data: stats } = useStats();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [variablesPanelOpen, setVariablesPanelOpen] = useState(true);

  // Build variables from current stats for preview
  const currentVariables = useMemo(() => buildFormulaVariables(stats), [stats]);

  const updateFormula = (cardId: string, updates: Partial<CardFormulaConfig>) => {
    setFormulas(prev =>
      prev.map(f => (f.cardId === cardId ? { ...f, ...updates, isCustom: true } : f))
    );
    setHasChanges(true);
  };

  const resetFormula = (cardId: string) => {
    const defaultConfig = DEFAULT_CARD_FORMULAS[cardId];
    if (defaultConfig) {
      setFormulas(prev =>
        prev.map(f =>
          f.cardId === cardId
            ? { ...f, formula: defaultConfig.formula, description: defaultConfig.description, isCustom: false }
            : f
        )
      );
      setHasChanges(true);
      toast.info('تم إعادة المعادلة للافتراضية');
    }
  };

  const insertVariable = (cardId: string, variableKey: string) => {
    const formula = formulas.find(f => f.cardId === cardId);
    if (formula) {
      const newFormula = formula.formula ? `${formula.formula} + ${variableKey}` : variableKey;
      updateFormula(cardId, { formula: newFormula });
    }
  };

  const handleSave = async () => {
    try {
      // Validate all formulas before saving
      for (const f of formulas) {
        const { error } = evaluateFormula(f.formula, currentVariables);
        if (error) {
          toast.error(`خطأ في معادلة "${CARD_DEFINITIONS.find(c => c.id === f.cardId)?.label}": ${error}`);
          return;
        }
      }
      await saveFormulas(formulas);
      setHasChanges(false);
      toast.success('تم حفظ المعادلات بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const { decimals: _dec } = useNumberFormat();
  const formatNumber = (n: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: _dec, maximumFractionDigits: _dec }).format(_dec === 0 ? Math.round(n) : n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Code2 className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>معادلات بطاقات لوحة التحكم</CardTitle>
                <CardDescription>
                  تعديل المعادلات الحسابية لكل بطاقة في لوحة التحكم باستخدام المتغيرات المتاحة
                </CardDescription>
              </div>
            </div>
            {hasChanges && (
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 ml-2" />
                حفظ المعادلات
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Variables Reference Panel */}
      <Collapsible open={variablesPanelOpen} onOpenChange={setVariablesPanelOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Variable className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">المتغيرات المتاحة</CardTitle>
                    <CardDescription>اضغط على أي متغير لنسخه</CardDescription>
                  </div>
                </div>
                {variablesPanelOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {VARIABLE_CATEGORIES.map(cat => {
                  const vars = FORMULA_VARIABLES.filter(v => v.category === cat.key);
                  if (vars.length === 0) return null;
                  return (
                    <div key={cat.key}>
                      <Label className="text-sm font-semibold mb-2 block">{cat.label}</Label>
                      <div className="flex flex-wrap gap-2">
                        {vars.map(v => (
                          <Badge
                            key={v.key}
                            variant="outline"
                            className={`cursor-pointer hover:scale-105 transition-transform px-3 py-1.5 text-xs ${cat.color}`}
                            onClick={() => {
                              navigator.clipboard.writeText(v.key);
                              toast.success(`تم نسخ: ${v.key}`);
                            }}
                          >
                            <span className="ml-1">{v.icon}</span>
                            <span className="font-mono text-[11px]">{v.key}</span>
                            <span className="mx-1 opacity-50">|</span>
                            <span>{v.label}</span>
                            {currentVariables[v.key] !== undefined && (
                              <>
                                <span className="mx-1 opacity-50">=</span>
                                <span className="font-bold">{formatNumber(currentVariables[v.key])}</span>
                              </>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <Separator />
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">العمليات الحسابية المدعومة:</p>
                    <p className="font-mono">+ (جمع) &nbsp; - (طرح) &nbsp; * (ضرب) &nbsp; / (قسمة) &nbsp; ( ) (أقواس)</p>
                    <p className="mt-1">مثال: <code className="bg-muted px-1 rounded">gross_profit - car_expenses - payroll_expenses</code></p>
                    <p className="mt-1">مثال ضريبة: <code className="bg-muted px-1 rounded">month_sales_amount / vat_multiplier</code> (للحصول على المبلغ الأساسي)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Card Formula Editors */}
      <div className="space-y-4">
        {CARD_DEFINITIONS.map(card => {
          const formulaConfig = formulas.find(f => f.cardId === card.id);
          const isExpanded = expandedCard === card.id;
          const currentFormula = formulaConfig?.formula || DEFAULT_CARD_FORMULAS[card.id]?.formula || '';
          const preview = evaluateFormula(currentFormula, currentVariables);

          return (
            <Card
              key={card.id}
              className={`transition-all ${isExpanded ? 'ring-2 ring-primary/30' : ''}`}
            >
              <CardHeader
                className="cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {card.label}
                        {formulaConfig?.isCustom && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Sparkles className="w-3 h-3 ml-1" />
                            مخصص
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs mt-1 ltr" dir="ltr">
                        {currentFormula}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">القيمة الحالية</p>
                      <p className={`font-bold text-sm ${preview.error ? 'text-destructive' : 'text-foreground'}`}>
                        {preview.error ? '⚠️ خطأ' : formatNumber(preview.result)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <Separator />

                  {/* Formula Editor */}
                  <div className="space-y-2">
                    <Label className="font-semibold">المعادلة الحسابية</Label>
                    <Textarea
                      value={currentFormula}
                      onChange={e => updateFormula(card.id, { formula: e.target.value })}
                      placeholder="أدخل المعادلة هنا..."
                      className="font-mono text-sm min-h-[80px] ltr"
                      dir="ltr"
                    />
                    {preview.error && (
                      <p className="text-xs text-destructive">⚠️ {preview.error}</p>
                    )}
                  </div>

                  {/* Quick Insert Variables */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">إدراج سريع للمتغيرات:</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {FORMULA_VARIABLES.map(v => (
                        <Badge
                          key={v.key}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 text-[10px] px-2 py-0.5"
                          onClick={() => insertVariable(card.id, v.key)}
                        >
                          {v.icon} {v.key}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">وصف المعادلة</Label>
                    <Input
                      value={formulaConfig?.description || ''}
                      onChange={e => updateFormula(card.id, { description: e.target.value })}
                      placeholder="وصف المعادلة..."
                      className="text-sm"
                    />
                  </div>

                  {/* Preview */}
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5" />
                        معاينة النتيجة (بيانات حية)
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">المعادلة:</p>
                        <p className="font-mono text-xs mt-0.5" dir="ltr">{currentFormula}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">النتيجة:</p>
                        <p className={`font-bold text-lg mt-0.5 ${preview.error ? 'text-destructive' : 'text-primary'}`}>
                          {preview.error ? preview.error : formatNumber(preview.result)}
                          {!preview.error && card.type === 'currency' && (
                            <span className="text-xs font-normal text-muted-foreground mr-1">ر.س</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* VAT Toggle */}
                  <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                    <div>
                      <Label className="text-sm">تضمين الضريبة تلقائياً</Label>
                      <p className="text-xs text-muted-foreground">ضرب النتيجة في 1.15 تلقائياً</p>
                    </div>
                    <Switch
                      checked={formulaConfig?.includeVAT ?? false}
                      onCheckedChange={checked => updateFormula(card.id, { includeVAT: checked })}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => resetFormula(card.id)}>
                      <RotateCcw className="w-3.5 h-3.5 ml-1.5" />
                      إعادة الافتراضي
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Operators Reference */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { op: '+', label: 'جمع', example: 'a + b' },
              { op: '-', label: 'طرح', example: 'a - b' },
              { op: '*', label: 'ضرب', example: 'a * b' },
              { op: '/', label: 'قسمة', example: 'a / b' },
            ].map(({ op, label, example }) => (
              <div
                key={op}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  navigator.clipboard.writeText(` ${op} `);
                  toast.success(`تم نسخ: ${op}`);
                }}
              >
                <span className="text-2xl font-bold text-primary w-8 text-center">{op}</span>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground font-mono" dir="ltr">{example}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
