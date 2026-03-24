/**
 * Formula Editor Hook - Extracted from FinancialStatementsFormulaEditor.tsx
 */
import { useState, useCallback, useEffect } from 'react';
import { useFormulaVariables, useFormulaDefinitions, useSaveFormula, useDeleteFormula } from '@/hooks/useFormulas';
import {
  FormulaNode, FormulaDefinition, FormulaVariable,
  DEFAULT_FORMULAS, generateNodeId, evaluateFormula, seedDefaultFormulas
} from '@/services/formulas';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useFormulaEditor(currentValues: Record<string, number>, onApplyFormula?: (key: string, result: number) => void) {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('balance_sheet');
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
  const { data: formulas = [], isLoading: loadingFormulas } = useFormulaDefinitions(activeCategory);
  const saveFormula = useSaveFormula();
  const deleteFormulaMutation = useDeleteFormula();

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
    setEditingFormula(null); setFormulaNodes([]); setFormulaName('');
    setFormulaKey(''); setFormulaDescription(''); setIsCreatingNew(true); setTestResult(null);
  }, []);

  const handleAddVariable = useCallback((variable: FormulaVariable) => {
    setFormulaNodes(prev => [...prev, { id: generateNodeId(), type: 'variable', value: variable.variable_key, label: variable.variable_name, color: variable.color || 'gray', icon: variable.icon }]);
  }, []);

  const handleAddOperator = useCallback((operator: string) => {
    setFormulaNodes(prev => [...prev, { id: generateNodeId(), type: 'operator', value: operator }]);
  }, []);

  const handleAddNumber = useCallback((num: string) => {
    setFormulaNodes(prev => [...prev, { id: generateNodeId(), type: 'number', value: num }]);
  }, []);

  const handleAddParenthesis = useCallback((paren: '(' | ')') => {
    setFormulaNodes(prev => [...prev, { id: generateNodeId(), type: 'parenthesis', value: paren }]);
  }, []);

  const handleRemoveNode = useCallback((nodeId: string) => {
    setFormulaNodes(prev => prev.filter(n => n.id !== nodeId));
  }, []);

  const handleClearFormula = useCallback(() => { setFormulaNodes([]); setTestResult(null); }, []);

  const handleReorderNodes = useCallback((startIndex: number, endIndex: number) => {
    setFormulaNodes(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const handleSaveFormula = async () => {
    if (!formulaName.trim() || !formulaKey.trim()) { toast.error('يرجى إدخال اسم ومعرف المعادلة'); return; }
    await saveFormula.mutateAsync({
      id: editingFormula?.id, formula_category: activeCategory, formula_key: formulaKey,
      formula_name: formulaName, formula_expression: formulaNodes, description: formulaDescription,
      is_active: true, display_order: editingFormula?.display_order ?? formulas.length,
    });
    setIsCreatingNew(false);
  };

  const handleDeleteFormula = async () => {
    if (!formulaToDelete) return;
    await deleteFormulaMutation.mutateAsync(formulaToDelete);
    setShowDeleteDialog(false); setFormulaToDelete(null);
    if (editingFormula?.id === formulaToDelete) handleNewFormula();
  };

  const handleTestFormula = () => {
    const testValues = {
      cash_and_banks: 150000, car_inventory: 800000, accounts_receivable: 50000,
      fixed_assets_net: 200000, prepaid_expenses_total: 24000, accounts_payable: 100000,
      vat_payable: 15000, employee_benefits: 30000, finance_lease_liability: 50000,
      capital: 500000, retained_earnings: 150000, statutory_reserve: 50000,
      total_sales: 500000, gross_profit_from_sales: 75000, commissions_earned: 5000,
      car_expenses: 15000, payroll_total: 20000, rent_expenses: 8000, general_expenses: 12000,
      vat_expenses: 22500, financing_costs: 3000, zakat_base: 600000, zakat_provision: 15000,
      profit_before_zakat: 32000, net_profit: 17000, operating_cash_flow: 45000,
      investing_cash_flow: -30000, financing_cash_flow: -10000, ...currentValues,
    };
    setTestResult(evaluateFormula(formulaNodes, testValues));
  };

  const handleApplyFormula = () => {
    if (testResult !== null && onApplyFormula && formulaKey) {
      onApplyFormula(formulaKey, testResult);
      toast.success(`تم تطبيق نتيجة المعادلة: ${testResult.toLocaleString()}`);
    }
  };

  const handleSeedDefaults = useCallback(async () => {
    if (!companyId) { toast.error('يرجى اختيار شركة أولاً'); return; }
    const defaultsCount = (DEFAULT_FORMULAS[activeCategory] || []).length;
    if (defaultsCount === 0) { toast.info('لا توجد معادلات افتراضية لهذه الفئة حالياً'); return; }
    setIsSeedingDefaults(true);
    try {
      const { inserted } = await seedDefaultFormulas(companyId, activeCategory);
      await queryClient.invalidateQueries({ queryKey: ['formula-definitions', companyId, activeCategory] });
      toast.success(inserted > 0 ? `تم إضافة ${inserted} معادلة افتراضية` : 'المعادلات الافتراضية موجودة بالفعل');
    } catch (e) { toast.error('تعذر إضافة المعادلات الافتراضية'); }
    finally { setIsSeedingDefaults(false); }
  }, [companyId, activeCategory, queryClient]);

  useEffect(() => {
    setEditingFormula(null); setIsCreatingNew(false); setFormulaNodes([]);
    setFormulaName(''); setFormulaKey(''); setTestResult(null);
  }, [activeCategory]);

  useEffect(() => {
    if (!editingFormula && !isCreatingNew && formulas.length > 0) handleSelectFormula(formulas[0]);
  }, [formulas, editingFormula, isCreatingNew, handleSelectFormula]);

  return {
    isOpen, setIsOpen, activeCategory, setActiveCategory,
    editingFormula, formulaNodes, formulaName, setFormulaName, formulaKey, setFormulaKey,
    formulaDescription, setFormulaDescription, showDeleteDialog, setShowDeleteDialog,
    formulaToDelete, setFormulaToDelete, isCreatingNew, testResult, isSeedingDefaults,
    variables, variablesByCategory, formulas, loadingVariables, loadingFormulas, saveFormula,
    handleSelectFormula, handleNewFormula, handleAddVariable, handleAddOperator,
    handleAddNumber, handleAddParenthesis, handleRemoveNode, handleClearFormula,
    handleReorderNodes, handleSaveFormula, handleDeleteFormula, handleTestFormula,
    handleApplyFormula, handleSeedDefaults,
  };
}
