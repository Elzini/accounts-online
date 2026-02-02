// Formula Builder Tab - تبويب بناء المعادلات
import { useEffect, useState, useCallback } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  GripVertical,
  Play,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useFormulaVariables, useFormulaDefinitions, useSaveFormula, useDeleteFormula } from '@/hooks/useFormulas';
import { 
  FormulaNode, 
  FormulaDefinition, 
  FormulaVariable,
  FORMULA_CATEGORIES,
  OPERATORS,
  generateNodeId,
  formulaToString,
  evaluateFormula,
  seedDefaultFormulas
} from '@/services/formulas';
import { FormulaCanvas } from './formula-builder/FormulaCanvas';
import { VariablesPalette } from './formula-builder/VariablesPalette';
import { FormulaPreview } from './formula-builder/FormulaPreview';
import { cn } from '@/lib/utils';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function FormulaBuilderTab() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  const [selectedCategory, setSelectedCategory] = useState('profit');
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
  const { data: formulas = [], isLoading: loadingFormulas } = useFormulaDefinitions(selectedCategory);
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
      return;
    }

    await saveFormula.mutateAsync({
      id: editingFormula?.id,
      formula_category: selectedCategory,
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
    // Use mock values for testing
    const mockValues: Record<string, number> = {
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
    };

    const result = evaluateFormula(formulaNodes, mockValues);
    setTestResult(result);
  };

  const handleSeedDefaults = useCallback(async () => {
    if (!companyId) {
      toast.error('يرجى اختيار شركة أولاً');
      return;
    }
    setIsSeedingDefaults(true);
    try {
      const { inserted } = await seedDefaultFormulas(companyId, selectedCategory);
      await queryClient.invalidateQueries({ queryKey: ['formula-definitions', companyId, selectedCategory] });
      toast.success(inserted > 0 ? `تم إضافة ${inserted} معادلة افتراضية` : 'المعادلات الافتراضية موجودة بالفعل');
    } catch (e: any) {
      console.error('Seed default formulas error:', e);
      toast.error('تعذر إضافة المعادلات الافتراضية');
    } finally {
      setIsSeedingDefaults(false);
    }
  }, [companyId, queryClient, selectedCategory]);

  // If we have formulas but nothing selected yet, auto-select the first one.
  useEffect(() => {
    if (!editingFormula && !isCreatingNew && formulas.length > 0) {
      setEditingFormula(formulas[0]);
      setFormulaNodes(formulas[0].formula_expression || []);
      setFormulaName(formulas[0].formula_name);
      setFormulaKey(formulas[0].formula_key);
      setFormulaDescription(formulas[0].description || '');
      setTestResult(null);
    }
  }, [editingFormula, formulas, isCreatingNew]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>محرر المعادلات المرئي</CardTitle>
              <CardDescription>
                قم ببناء وتخصيص معادلات الحسابات بالسحب والإفلات مثل Excel
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
            {FORMULA_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.key} value={cat.key} className="text-xs sm:text-sm">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {FORMULA_CATEGORIES.map((cat) => (
            <TabsContent key={cat.key} value={cat.key}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Formulas List - Left Panel */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">المعادلات</Label>
                    <Button variant="outline" size="sm" onClick={handleNewFormula}>
                      <Plus className="w-4 h-4 ml-1" />
                      جديد
                    </Button>
                  </div>

                  <ScrollArea className="h-[400px] border rounded-lg p-2">
                    {loadingFormulas ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : formulas.length === 0 && !isCreatingNew ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-2">لا توجد معادلات محفوظة لهذه الفئة</p>
                        <p className="text-xs mb-4">يمكنك إضافة المعادلات الافتراضية (مثل: إجمالي الربح / صافي الربح) ثم تعديلها.</p>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSeedDefaults}
                            disabled={isSeedingDefaults}
                          >
                            {isSeedingDefaults ? 'جارٍ الإضافة...' : 'إضافة المعادلات الافتراضية'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleNewFormula}>
                            <Plus className="w-4 h-4 ml-1" />
                            معادلة جديدة
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {formulas.map((formula) => (
                          <div
                            key={formula.id}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all",
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

                {/* Formula Builder - Center Panel */}
                <div className="lg:col-span-6 space-y-4">
                  {(editingFormula || isCreatingNew) ? (
                    <>
                      {/* Formula Metadata */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-2">
                          <Label>اسم المعادلة</Label>
                          <Input
                            value={formulaName}
                            onChange={(e) => setFormulaName(e.target.value)}
                            placeholder="مثال: صافي الربح"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>المعرف (بالإنجليزية)</Label>
                          <Input
                            value={formulaKey}
                            onChange={(e) => setFormulaKey(e.target.value.replace(/\s/g, '_').toLowerCase())}
                            placeholder="مثال: net_profit"
                            dir="ltr"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>الوصف (اختياري)</Label>
                          <Textarea
                            value={formulaDescription}
                            onChange={(e) => setFormulaDescription(e.target.value)}
                            placeholder="وصف المعادلة والغرض منها..."
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Formula Canvas */}
                      <FormulaCanvas
                        nodes={formulaNodes}
                        onRemoveNode={handleRemoveNode}
                        onReorder={handleReorderNodes}
                        onClear={handleClearFormula}
                      />

                      {/* Operators Bar */}
                      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                        <span className="text-sm text-muted-foreground ml-2">العمليات:</span>
                        {OPERATORS.map((op) => (
                          <Button
                            key={op.value}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOperator(op.value)}
                            title={op.description}
                            className="w-10 h-10 text-lg font-bold"
                          >
                            {op.label}
                          </Button>
                        ))}
                        <div className="border-r mx-2 h-8" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddParenthesis('(')}
                          className="w-10 h-10 text-lg"
                        >
                          (
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddParenthesis(')')}
                          className="w-10 h-10 text-lg"
                        >
                          )
                        </Button>
                        <div className="border-r mx-2 h-8" />
                        <Input
                          type="number"
                          placeholder="رقم"
                          className="w-24"
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

                      {/* Actions Bar */}
                      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTestFormula}
                            disabled={formulaNodes.length === 0}
                          >
                            <Play className="w-4 h-4 ml-1" />
                            اختبار المعادلة
                          </Button>
                          {testResult !== null && (
                            <Badge variant="secondary" className="text-base px-3">
                              النتيجة: {testResult.toLocaleString('ar-SA')}
                            </Badge>
                          )}
                        </div>
                        <Button
                          onClick={handleSaveFormula}
                          disabled={!formulaName.trim() || !formulaKey.trim() || saveFormula.isPending}
                        >
                          <Save className="w-4 h-4 ml-1" />
                          حفظ المعادلة
                        </Button>
                      </div>

                      {/* Formula Preview */}
                      <FormulaPreview
                        nodes={formulaNodes}
                        variables={variables}
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg text-muted-foreground">
                      <Calculator className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg mb-2">اختر معادلة للتعديل</p>
                      <p className="text-sm">أو أنشئ معادلة جديدة</p>
                      <Button variant="outline" className="mt-4" onClick={handleNewFormula}>
                        <Plus className="w-4 h-4 ml-1" />
                        معادلة جديدة
                      </Button>
                    </div>
                  )}
                </div>

                {/* Variables Palette - Right Panel */}
                <div className="lg:col-span-3">
                  <VariablesPalette
                    variablesByCategory={variablesByCategory}
                    onAddVariable={handleAddVariable}
                    isLoading={loadingVariables}
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المعادلة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المعادلة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFormula} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
