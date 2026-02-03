// محرر معادلات ميزان المراجعة - Trial Balance Formula Editor
import { useState, useCallback, useEffect } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  Play,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFormulaVariables, useFormulaDefinitions, useSaveFormula, useDeleteFormula } from '@/hooks/useFormulas';
import { 
  FormulaNode, 
  FormulaDefinition, 
  FormulaVariable,
  OPERATORS,
  DEFAULT_FORMULAS,
  generateNodeId,
  formulaToString,
  evaluateFormula,
  seedDefaultFormulas
} from '@/services/formulas';
import { FormulaCanvas } from '@/components/control-center/tabs/formula-builder/FormulaCanvas';
import { VariablesPalette } from '@/components/control-center/tabs/formula-builder/VariablesPalette';
import { cn } from '@/lib/utils';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TrialBalanceFormulaEditorProps {
  // القيم الحالية من ميزان المراجعة لاختبار المعادلات
  currentValues?: Record<string, number>;
  // دالة لتطبيق نتيجة معادلة
  onApplyFormula?: (formulaKey: string, result: number) => void;
}

export function TrialBalanceFormulaEditor({ 
  currentValues = {},
  onApplyFormula 
}: TrialBalanceFormulaEditorProps) {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  const [isOpen, setIsOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<FormulaDefinition | null>(null);
  const [formulaNodes, setFormulaNodes] = useState<FormulaNode[]>([]);
  const [formulaName, setFormulaName] = useState('');
  const [formulaKey, setFormulaKey] = useState('');
  const [formulaDescription, setFormulaDescription] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formulaToDelete, setFormulaToDelete] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [testResult, setTestResult] = useState<number | null>(null);
  const [isSeedingDefaults, setIsSeedingDefaults] = useState(false);

  const { data: variables = [], isLoading: loadingVariables } = useFormulaVariables();
  const { data: formulas = [], isLoading: loadingFormulas } = useFormulaDefinitions('trial_balance');
  const saveFormula = useSaveFormula();
  const deleteFormula = useDeleteFormula();

  // Group variables by category
  const variablesByCategory = variables.reduce((acc, v) => {
    const cat = v.variable_category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {} as Record<string, FormulaVariable[]>);

  const handleSelectFormula = useCallback((formula: FormulaDefinition) => {
    setEditingFormula(formula);
    setFormulaNodes(formula.formula_expression || []);
    setFormulaName(formula.formula_name);
    setFormulaKey(formula.formula_key);
    setFormulaDescription(formula.description || '');
    setIsCreatingNew(false);
    setTestResult(null);
  }, []);

  const handleNewFormula = useCallback(() => {
    setEditingFormula(null);
    setFormulaNodes([]);
    setFormulaName('');
    setFormulaKey('');
    setFormulaDescription('');
    setIsCreatingNew(true);
    setTestResult(null);
  }, []);

  const handleAddVariable = useCallback((variable: FormulaVariable) => {
    const newNode: FormulaNode = {
      id: generateNodeId(),
      type: 'variable',
      value: variable.variable_key,
      label: variable.variable_name,
      color: variable.color || 'gray',
      icon: variable.icon,
    };
    setFormulaNodes(prev => [...prev, newNode]);
  }, []);

  const handleAddOperator = useCallback((operator: string) => {
    const newNode: FormulaNode = {
      id: generateNodeId(),
      type: 'operator',
      value: operator,
    };
    setFormulaNodes(prev => [...prev, newNode]);
  }, []);

  const handleAddNumber = useCallback((num: string) => {
    const newNode: FormulaNode = {
      id: generateNodeId(),
      type: 'number',
      value: num,
    };
    setFormulaNodes(prev => [...prev, newNode]);
  }, []);

  const handleAddParenthesis = useCallback((paren: '(' | ')') => {
    const newNode: FormulaNode = {
      id: generateNodeId(),
      type: 'parenthesis',
      value: paren,
    };
    setFormulaNodes(prev => [...prev, newNode]);
  }, []);

  const handleRemoveNode = useCallback((nodeId: string) => {
    setFormulaNodes(prev => prev.filter(n => n.id !== nodeId));
  }, []);

  const handleClearFormula = useCallback(() => {
    setFormulaNodes([]);
    setTestResult(null);
  }, []);

  const handleReorderNodes = useCallback((startIndex: number, endIndex: number) => {
    setFormulaNodes(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const handleSaveFormula = async () => {
    if (!formulaName.trim() || !formulaKey.trim()) {
      toast.error('يرجى إدخال اسم ومعرف المعادلة');
      return;
    }

    await saveFormula.mutateAsync({
      id: editingFormula?.id,
      formula_category: 'trial_balance',
      formula_key: formulaKey,
      formula_name: formulaName,
      formula_expression: formulaNodes,
      description: formulaDescription,
      is_active: true,
      display_order: editingFormula?.display_order ?? formulas.length,
    });

    setIsCreatingNew(false);
  };

  const handleDeleteFormula = async () => {
    if (!formulaToDelete) return;
    
    await deleteFormula.mutateAsync(formulaToDelete);
    setShowDeleteDialog(false);
    setFormulaToDelete(null);
    
    if (editingFormula?.id === formulaToDelete) {
      handleNewFormula();
    }
  };

  const handleTestFormula = () => {
    // استخدم القيم الفعلية من ميزان المراجعة إذا كانت متوفرة
    const testValues = {
      // القيم الافتراضية للاختبار
      total_sales: 500000,
      gross_profit_from_sales: 75000,
      commissions_earned: 5000,
      car_expenses: 15000,
      payroll_total: 20000,
      rent_expenses: 8000,
      general_expenses: 12000,
      vat_expenses: 22500,
      financing_costs: 3000,
      cash_and_banks: 150000,
      car_inventory: 800000,
      accounts_receivable: 50000,
      fixed_assets_net: 200000,
      prepaid_expenses_total: 24000,
      accounts_payable: 100000,
      vat_payable: 15000,
      employee_benefits: 30000,
      finance_lease_liability: 50000,
      capital: 500000,
      retained_earnings: 150000,
      statutory_reserve: 50000,
      zakat_base: 600000,
      zakat_provision: 15000,
      profit_before_zakat: 32000,
      net_profit: 17000,
      // دمج القيم الفعلية
      ...currentValues,
    };

    const result = evaluateFormula(formulaNodes, testValues);
    setTestResult(result);
  };

  const handleApplyFormula = () => {
    if (testResult !== null && onApplyFormula && formulaKey) {
      onApplyFormula(formulaKey, testResult);
      toast.success(`تم تطبيق نتيجة المعادلة: ${testResult.toLocaleString()}`);
    }
  };

  const handleSeedDefaults = useCallback(async () => {
    if (!companyId) {
      toast.error('يرجى اختيار شركة أولاً');
      return;
    }

    const defaultsCount = (DEFAULT_FORMULAS['trial_balance'] || []).length;
    if (defaultsCount === 0) {
      toast.info('لا توجد معادلات افتراضية لهذه الفئة حالياً');
      return;
    }

    setIsSeedingDefaults(true);
    try {
      const { inserted } = await seedDefaultFormulas(companyId, 'trial_balance');
      await queryClient.invalidateQueries({ queryKey: ['formula-definitions', companyId, 'trial_balance'] });
      toast.success(inserted > 0 ? `تم إضافة ${inserted} معادلة افتراضية` : 'المعادلات الافتراضية موجودة بالفعل');
    } catch (e: any) {
      console.error('Seed default formulas error:', e);
      toast.error('تعذر إضافة المعادلات الافتراضية');
    } finally {
      setIsSeedingDefaults(false);
    }
  }, [companyId, queryClient]);

  // Auto-select first formula when loaded
  useEffect(() => {
    if (!editingFormula && !isCreatingNew && formulas.length > 0) {
      handleSelectFormula(formulas[0]);
    }
  }, [formulas, editingFormula, isCreatingNew, handleSelectFormula]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="w-4 h-4" />
          محرر المعادلات
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            محرر معادلات ميزان المراجعة
          </DialogTitle>
          <DialogDescription>
            بناء وتخصيص معادلات حساب الإجماليات والمؤشرات المالية
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
          {/* قائمة المعادلات */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">المعادلات</Label>
              <Button variant="outline" size="sm" onClick={handleNewFormula}>
                <Plus className="w-4 h-4 ml-1" />
                جديد
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-2">
              {loadingFormulas ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : formulas.length === 0 && !isCreatingNew ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-2 text-sm">لا توجد معادلات</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSeedDefaults}
                    disabled={isSeedingDefaults}
                    className="gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isSeedingDefaults ? 'جارٍ الإضافة...' : 'إضافة الافتراضية'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formulas.map((formula) => (
                    <div
                      key={formula.id}
                      className={cn(
                        "p-2 rounded-lg border cursor-pointer transition-all",
                        editingFormula?.id === formula.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => handleSelectFormula(formula)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{formula.formula_name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormulaToDelete(formula.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {formulaToString(formula.formula_expression)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* محرر المعادلة */}
          <div className="lg:col-span-6 space-y-3">
            {(editingFormula || isCreatingNew) ? (
              <>
                {/* معلومات المعادلة */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs">اسم المعادلة</Label>
                    <Input
                      value={formulaName}
                      onChange={(e) => setFormulaName(e.target.value)}
                      placeholder="مثال: إجمالي الإيرادات"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">المعرف</Label>
                    <Input
                      value={formulaKey}
                      onChange={(e) => setFormulaKey(e.target.value.replace(/\s/g, '_').toLowerCase())}
                      placeholder="total_revenue"
                      dir="ltr"
                      className="h-8"
                    />
                  </div>
                </div>

                {/* لوحة المعادلة */}
                <FormulaCanvas
                  nodes={formulaNodes}
                  onRemoveNode={handleRemoveNode}
                  onReorder={handleReorderNodes}
                  onClear={handleClearFormula}
                />

                {/* شريط العمليات */}
                <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg flex-wrap">
                  <span className="text-xs text-muted-foreground">العمليات:</span>
                  {OPERATORS.map((op) => (
                    <Button
                      key={op.value}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddOperator(op.value)}
                      title={op.description}
                      className="w-8 h-8 text-base font-bold p-0"
                    >
                      {op.label}
                    </Button>
                  ))}
                  <div className="border-r mx-1 h-6" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddParenthesis('(')}
                    className="w-8 h-8 text-base p-0"
                  >
                    (
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddParenthesis(')')}
                    className="w-8 h-8 text-base p-0"
                  >
                    )
                  </Button>
                  <div className="border-r mx-1 h-6" />
                  <Input
                    type="number"
                    placeholder="رقم"
                    className="w-20 h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value) {
                          handleAddNumber(input.value);
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>

                {/* نتيجة الاختبار */}
                {testResult !== null && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">نتيجة الاختبار:</span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-400">
                        {formatCurrency(testResult)} ر.س
                      </span>
                    </div>
                    {onApplyFormula && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={handleApplyFormula}
                      >
                        تطبيق النتيجة
                      </Button>
                    )}
                  </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestFormula}
                    disabled={formulaNodes.length === 0}
                    className="gap-1"
                  >
                    <Play className="w-4 h-4" />
                    اختبار
                  </Button>
                  <Button
                    onClick={handleSaveFormula}
                    disabled={!formulaName.trim() || !formulaKey.trim() || saveFormula.isPending}
                    className="gap-1"
                  >
                    <Save className="w-4 h-4" />
                    {saveFormula.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <p>اختر معادلة للتعديل أو أنشئ واحدة جديدة</p>
              </div>
            )}
          </div>

          {/* لوحة المتغيرات */}
          <div className="lg:col-span-3">
            <VariablesPalette
              variablesByCategory={variablesByCategory}
              onAddVariable={handleAddVariable}
              isLoading={loadingVariables}
            />
          </div>
        </div>

        {/* حوار تأكيد الحذف */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف هذه المعادلة نهائياً ولا يمكن استرجاعها.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteFormula}>
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
