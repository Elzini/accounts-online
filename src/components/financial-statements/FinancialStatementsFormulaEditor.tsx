// محرر معادلات القوائم المالية - Refactored
// Logic extracted to useFormulaEditor.ts
import { Calculator, Plus, Trash2, Save, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OPERATORS, formulaToString } from '@/services/formulas';
import { FormulaCanvas } from '@/components/control-center/tabs/formula-builder/FormulaCanvas';
import { VariablesPalette } from '@/components/control-center/tabs/formula-builder/VariablesPalette';
import { cn } from '@/lib/utils';
import { useFormulaEditor } from './useFormulaEditor';

interface FinancialStatementsFormulaEditorProps {
  currentValues?: Record<string, number>;
  onApplyFormula?: (formulaKey: string, result: number) => void;
}

const FORMULA_TABS = [
  { key: 'balance_sheet', label: 'المركز المالي' },
  { key: 'income_statement', label: 'قائمة الدخل' },
  { key: 'cash_flow', label: 'التدفق النقدي' },
  { key: 'zakat', label: 'الزكاة' },
];

export function FinancialStatementsFormulaEditor({ currentValues = {}, onApplyFormula }: FinancialStatementsFormulaEditorProps) {
  const editor = useFormulaEditor(currentValues, onApplyFormula);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  return (
    <Dialog open={editor.isOpen} onOpenChange={editor.setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Calculator className="w-4 h-4" />محرر المعادلات</Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" />محرر معادلات القوائم المالية</DialogTitle>
          <DialogDescription>بناء وتخصيص معادلات حساب القوائم المالية المختلفة</DialogDescription>
        </DialogHeader>

        <Tabs value={editor.activeCategory} onValueChange={editor.setActiveCategory}>
          <TabsList className="grid w-full grid-cols-4">
            {FORMULA_TABS.map(tab => (<TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
          {/* Formula List */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">المعادلات</Label>
              <Button variant="outline" size="sm" onClick={editor.handleNewFormula}><Plus className="w-4 h-4 ml-1" />جديد</Button>
            </div>
            <ScrollArea className="h-[280px] border rounded-lg p-2">
              {editor.loadingFormulas ? (
                <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : editor.formulas.length === 0 && !editor.isCreatingNew ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-2 text-sm">لا توجد معادلات</p>
                  <Button variant="outline" size="sm" onClick={editor.handleSeedDefaults} disabled={editor.isSeedingDefaults} className="gap-1">
                    <Sparkles className="w-4 h-4" />{editor.isSeedingDefaults ? 'جارٍ الإضافة...' : 'إضافة الافتراضية'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {editor.formulas.map((formula) => (
                    <div key={formula.id} className={cn("p-2 rounded-lg border cursor-pointer transition-all", editor.editingFormula?.id === formula.id ? "border-primary bg-primary/5" : "hover:border-primary/50")} onClick={() => editor.handleSelectFormula(formula)}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{formula.formula_name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); editor.setFormulaToDelete(formula.id); editor.setShowDeleteDialog(true); }}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{formulaToString(formula.formula_expression)}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Formula Editor */}
          <div className="lg:col-span-6 space-y-3">
            {(editor.editingFormula || editor.isCreatingNew) ? (
              <>
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs">اسم المعادلة</Label>
                    <Input value={editor.formulaName} onChange={(e) => editor.setFormulaName(e.target.value)} placeholder="مثال: إجمالي الموجودات" className="h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">المعرف</Label>
                    <Input value={editor.formulaKey} onChange={(e) => editor.setFormulaKey(e.target.value.replace(/\s/g, '_').toLowerCase())} placeholder="total_assets" dir="ltr" className="h-8" />
                  </div>
                </div>
                <FormulaCanvas nodes={editor.formulaNodes} onRemoveNode={editor.handleRemoveNode} onReorder={editor.handleReorderNodes} onClear={editor.handleClearFormula} />
                <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg flex-wrap">
                  <span className="text-xs text-muted-foreground">العمليات:</span>
                  {OPERATORS.map((op) => (
                    <Button key={op.value} variant="outline" size="sm" onClick={() => editor.handleAddOperator(op.value)} title={op.description} className="w-8 h-8 text-base font-bold p-0">{op.label}</Button>
                  ))}
                  <div className="border-r mx-1 h-6" />
                  <Button variant="outline" size="sm" onClick={() => editor.handleAddParenthesis('(')} className="w-8 h-8 text-base p-0">(</Button>
                  <Button variant="outline" size="sm" onClick={() => editor.handleAddParenthesis(')')} className="w-8 h-8 text-base p-0">)</Button>
                  <div className="border-r mx-1 h-6" />
                  <Input type="number" placeholder="رقم" className="w-20 h-8" onKeyDown={(e) => { if (e.key === 'Enter') { const input = e.target as HTMLInputElement; if (input.value) { editor.handleAddNumber(input.value); input.value = ''; } } }} />
                </div>
                {editor.testResult !== null && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">نتيجة الاختبار:</span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(editor.testResult)} ر.س</span>
                    </div>
                    {onApplyFormula && <Button variant="outline" size="sm" className="mt-2 w-full" onClick={editor.handleApplyFormula}>تطبيق النتيجة</Button>}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={editor.handleTestFormula} disabled={editor.formulaNodes.length === 0} className="gap-1"><Play className="w-4 h-4" />اختبار</Button>
                  <Button onClick={editor.handleSaveFormula} disabled={!editor.formulaName.trim() || !editor.formulaKey.trim() || editor.saveFormula.isPending} className="gap-1"><Save className="w-4 h-4" />{editor.saveFormula.isPending ? 'جارٍ الحفظ...' : 'حفظ'}</Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground"><p>اختر معادلة للتعديل أو أنشئ واحدة جديدة</p></div>
            )}
          </div>

          {/* Variables Palette */}
          <div className="lg:col-span-3">
            <VariablesPalette variablesByCategory={editor.variablesByCategory} onAddVariable={editor.handleAddVariable} isLoading={editor.loadingVariables} />
          </div>
        </div>

        <AlertDialog open={editor.showDeleteDialog} onOpenChange={editor.setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف هذه المعادلة نهائياً ولا يمكن استرجاعها.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={editor.handleDeleteFormula}>حذف</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
