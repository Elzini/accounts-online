import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDashboardConfig, useSaveDashboardConfig } from '@/hooks/useSystemControl';
import { evaluate } from 'mathjs';

// All available variables for card formulas
export const FORMULA_VARIABLES = [
  // Sales
  { key: 'month_sales_amount', label: 'مبيعات الشهر (مبلغ)', category: 'sales', icon: '💰' },
  { key: 'month_sales_count', label: 'عدد مبيعات الشهر', category: 'sales', icon: '🔢' },
  { key: 'today_sales_count', label: 'مبيعات اليوم', category: 'sales', icon: '📊' },
  { key: 'total_sales_amount', label: 'إجمالي المبيعات (السنة)', category: 'sales', icon: '📈' },
  { key: 'total_sales_count', label: 'عدد المبيعات (السنة)', category: 'sales', icon: '🔢' },
  { key: 'month_sales_profit', label: 'أرباح مبيعات الشهر', category: 'sales', icon: '💵' },
  // Purchases
  { key: 'total_purchases', label: 'إجمالي المشتريات', category: 'purchases', icon: '🛒' },
  { key: 'purchases_count', label: 'عدد المشتريات', category: 'purchases', icon: '📦' },
  // Profit & Expenses
  { key: 'gross_profit', label: 'الربح الإجمالي (قبل المصاريف)', category: 'profit', icon: '💎' },
  { key: 'net_profit', label: 'صافي الربح', category: 'profit', icon: '💰' },
  { key: 'car_expenses', label: 'مصاريف السيارات', category: 'expenses', icon: '🚗' },
  { key: 'general_expenses', label: 'المصاريف العامة', category: 'expenses', icon: '💸' },
  { key: 'payroll_expenses', label: 'مصاريف الرواتب', category: 'expenses', icon: '👷' },
  { key: 'prepaid_expenses', label: 'المصاريف المقدمة', category: 'expenses', icon: '📋' },
  { key: 'other_expenses', label: 'مصاريف أخرى', category: 'expenses', icon: '📉' },
  // Inventory
  { key: 'available_cars', label: 'السيارات المتاحة', category: 'inventory', icon: '🚗' },
  // Constants
  { key: 'vat_rate', label: 'نسبة الضريبة (0.15)', category: 'constants', icon: '🏷️' },
  { key: 'vat_multiplier', label: 'معامل الضريبة (1.15)', category: 'constants', icon: '✖️' },
] as const;

export type FormulaVariableKey = typeof FORMULA_VARIABLES[number]['key'];

export const VARIABLE_CATEGORIES = [
  { key: 'sales', label: 'المبيعات', color: 'bg-green-500/10 text-green-700 border-green-200' },
  { key: 'purchases', label: 'المشتريات', color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  { key: 'profit', label: 'الأرباح', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200' },
  { key: 'expenses', label: 'المصاريف', color: 'bg-red-500/10 text-red-700 border-red-200' },
  { key: 'inventory', label: 'المخزون', color: 'bg-purple-500/10 text-purple-700 border-purple-200' },
  { key: 'constants', label: 'ثوابت', color: 'bg-gray-500/10 text-gray-700 border-gray-200' },
];

// Default formulas for each card type
export const DEFAULT_CARD_FORMULAS: Record<string, { formula: string; description: string }> = {
  availableCars: {
    formula: 'available_cars',
    description: 'عدد السيارات بحالة "متاحة" ضمن السنة المالية',
  },
  totalPurchases: {
    formula: 'total_purchases',
    description: 'مجموع أسعار شراء جميع السيارات',
  },
  monthSales: {
    formula: 'month_sales_amount',
    description: 'مجموع مبيعات الشهر الحالي',
  },
  totalProfit: {
    formula: 'gross_profit - car_expenses - general_expenses - payroll_expenses - prepaid_expenses - other_expenses',
    description: 'صافي الربح = إجمالي الربح - جميع المصاريف',
  },
  todaySales: {
    formula: 'today_sales_count',
    description: 'عدد عمليات البيع اليوم',
  },
  monthSalesCount: {
    formula: 'month_sales_count',
    description: 'عدد عمليات البيع هذا الشهر',
  },
};

export interface CardFormulaConfig {
  cardId: string;
  formula: string;
  description: string;
  includeVAT: boolean;
  isCustom: boolean;
}

/**
 * Evaluate a formula string using the provided variables
 */
export function evaluateFormula(
  formula: string,
  variables: Record<string, number>
): { result: number; error: string | null } {
  try {
    if (!formula.trim()) return { result: 0, error: 'المعادلة فارغة' };
    
    // Replace variable names with values
    const result = evaluate(formula, variables);
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return { result: 0, error: 'النتيجة غير صالحة' };
    }
    
    return { result, error: null };
  } catch (err: any) {
    return { result: 0, error: err.message || 'خطأ في المعادلة' };
  }
}

/**
 * Build variables object from stats data
 */
export function buildFormulaVariables(stats: any): Record<string, number> {
  return {
    month_sales_amount: Number(stats?.monthSalesAmount) || 0,
    month_sales_count: Number(stats?.monthSales) || 0,
    today_sales_count: Number(stats?.todaySales) || 0,
    total_sales_amount: Number(stats?.totalSalesAmount) || 0,
    total_sales_count: Number(stats?.totalSalesCount) || 0,
    month_sales_profit: Number(stats?.monthSalesProfit) || 0,
    total_purchases: Number(stats?.totalPurchases) || 0,
    purchases_count: Number(stats?.purchasesCount) || 0,
    gross_profit: Number(stats?.totalGrossProfit) || 0,
    net_profit: Number(stats?.totalProfit) || 0,
    car_expenses: Number(stats?.totalCarExpenses) || 0,
    general_expenses: Number(stats?.totalGeneralExpenses) || 0,
    payroll_expenses: Number(stats?.payrollExpenses) || 0,
    prepaid_expenses: Number(stats?.prepaidExpensesDue) || 0,
    other_expenses: Number(stats?.otherGeneralExpenses) || 0,
    available_cars: Number(stats?.availableCars) || 0,
    vat_rate: 0.15,
    vat_multiplier: 1.15,
  };
}

/**
 * Hook to manage card formulas
 */
export function useCardFormulas() {
  const { data: dashboardConfig } = useDashboardConfig();
  const saveDashboardConfig = useSaveDashboardConfig();
  const [formulas, setFormulas] = useState<CardFormulaConfig[]>([]);

  // Load formulas from dashboard config
  useEffect(() => {
    if (dashboardConfig?.layout_settings?.card_formulas) {
      setFormulas(dashboardConfig.layout_settings.card_formulas as CardFormulaConfig[]);
    } else {
      // Initialize with defaults
      setFormulas(
        Object.entries(DEFAULT_CARD_FORMULAS).map(([cardId, config]) => ({
          cardId,
          formula: config.formula,
          description: config.description,
          includeVAT: false,
          isCustom: false,
        }))
      );
    }
  }, [dashboardConfig]);

  const getFormula = useCallback(
    (cardId: string): CardFormulaConfig | undefined => {
      return formulas.find(f => f.cardId === cardId);
    },
    [formulas]
  );

  const saveFormulas = useCallback(
    async (updatedFormulas: CardFormulaConfig[]) => {
      setFormulas(updatedFormulas);
      const existingLayout = dashboardConfig?.layout_settings || {};
      await saveDashboardConfig.mutateAsync({
        layout_settings: {
          ...existingLayout,
          card_formulas: updatedFormulas,
        } as any,
      });
    },
    [dashboardConfig, saveDashboardConfig]
  );

  return { formulas, setFormulas, getFormula, saveFormulas };
}
