/**
 * Hook for showing stat card detail dialogs.
 * Extracted from Dashboard.tsx to reduce component size.
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StatDetailData, CarDetailItem } from '@/components/dashboard/StatCardDetailDialog';
import { CardConfig } from '@/components/dashboard/DashboardCustomizer';

interface UseShowStatDetailOptions {
  stats: any;
  getCardConfig: (id: string) => CardConfig;
  getCardLabel: (id: string, defaultLabel: string) => string;
  getCardValue: (id: string, defaultValue: number) => number;
  accountBalances: Record<string, number>;
  accountsList: any[];
  formatCurrency: (value: number) => string;
  industryLabels: any;
  isCarDealership: boolean;
  companyId: string | null;
  t: any;
  projectCostAccountId: string | null;
  selectedFiscalYear: any;
  buildSalesCarDetails: () => CarDetailItem[];
  buildPurchaseCarDetails: () => CarDetailItem[];
  allTimeStats: any;
  setDetailData: (data: StatDetailData | null) => void;
  setDetailDialogOpen: (open: boolean) => void;
}

export function useShowStatDetail(opts: UseShowStatDetailOptions) {
  const {
    stats, getCardConfig, getCardLabel, getCardValue, accountBalances, accountsList,
    formatCurrency, industryLabels, isCarDealership, companyId, t,
    projectCostAccountId, selectedFiscalYear,
    buildSalesCarDetails, buildPurchaseCarDetails, allTimeStats,
    setDetailData, setDetailDialogOpen,
  } = opts;

  return useCallback(async (cardId: string) => {
    const cardCfg = getCardConfig(cardId);
    const resolvedSource = cardCfg.dataSource ?? (cardCfg.formulaAccounts?.length ? 'formula' : cardCfg.accountId ? 'account' : 'default');

    const defaultValueByCardId: Record<string, number> = {
      availableCars: stats.availableCars,
      totalPurchases: stats.totalPurchases,
      monthSales: stats.monthSalesAmount,
      totalProfit: stats.totalProfit,
      todaySales: stats.todaySales,
      monthSalesCount: stats.monthSales,
      allTimePurchases: allTimeStats?.allTimePurchases || 0,
      allTimeSales: allTimeStats?.allTimeSales || 0,
    };

    const fallbackValue = defaultValueByCardId[cardId] ?? 0;
    const resolvedValue = getCardValue(cardId, fallbackValue);

    // Account source
    if (resolvedSource === 'account' && cardCfg.accountId) {
      const account = accountsList.find(a => a.id === cardCfg.accountId);
      const accountLabel = [account?.code, account?.name || cardCfg.label || t.not_specified].filter(Boolean).join(' - ');
      setDetailData({
        title: getCardLabel(cardId, cardCfg.label || account?.name || cardId),
        value: formatCurrency(resolvedValue),
        subtitle: 'من رصيد الحساب المحدد',
        breakdown: [{ label: accountLabel, value: resolvedValue, type: 'total', description: 'الرصيد المجمع من القيود المرحلة' }],
        formula: `الرصيد = مجموع أرصدة الحساب ${account?.code ? `(${account.code})` : ''}`,
        showCarsTable: false,
      });
      setDetailDialogOpen(true);
      return;
    }

    // Formula source
    if (resolvedSource === 'formula' && cardCfg.formulaAccounts?.length) {
      const formulaBreakdown: { label: string; value: number; type?: 'add' | 'subtract' | 'total'; description?: string }[] = cardCfg.formulaAccounts.map(item => {
        const account = accountsList.find(a => a.id === item.accountId);
        const balance = accountBalances[item.accountId] || 0;
        const label = [account?.code || item.accountCode, account?.name || item.accountName].filter(Boolean).join(' - ');
        return { label, value: Math.abs(balance), type: (item.operator === '+' ? 'add' : 'subtract') as 'add' | 'subtract', description: 'رصيد الحساب المختار في المعادلة' };
      });
      formulaBreakdown.push({ label: t.net_profit, value: resolvedValue, type: 'total' as const, description: '' });
      const formulaText = cardCfg.formulaAccounts.map((item, idx) => {
        const account = accountsList.find(a => a.id === item.accountId);
        return `${idx === 0 ? '' : item.operator} ${account?.code || item.accountCode || item.accountId}`.trim();
      }).join(' ');
      setDetailData({
        title: getCardLabel(cardId, cardCfg.label || cardId),
        value: formatCurrency(resolvedValue),
        subtitle: 'محسوبة بمعادلة من الحسابات المختارة',
        breakdown: formulaBreakdown,
        formula: formulaText,
        showCarsTable: false,
      });
      setDetailDialogOpen(true);
      return;
    }

    // Default card behaviors
    let data: StatDetailData | null = null;
    switch (cardId) {
      case 'availableCars':
        data = { title: getCardLabel(cardId, industryLabels.availableItems), value: stats.availableCars, breakdown: [], cars: buildPurchaseCarDetails().filter(c => c.status === 'available'), showCarsTable: true };
        break;
      case 'totalPurchases': {
        if (!isCarDealership && companyId) {
          try {
            const { data: projectAccounts } = await supabase.from('account_categories').select('id, code, name, parent_id').eq('company_id', companyId).in('code', ['1301', '130', '13']);
            const projectParentIds = (projectAccounts || []).map(a => a.id);
            const { data: subAccounts } = await supabase.from('account_categories').select('id, code, name, parent_id').eq('company_id', companyId);
            const allAccounts = subAccounts || [];
            const findDescendants = (parentIds: string[]): typeof allAccounts => {
              const children = allAccounts.filter(a => a.parent_id && parentIds.includes(a.parent_id));
              if (children.length === 0) return [];
              return [...children, ...findDescendants(children.map(c => c.id))];
            };
            const projectSubAccounts = findDescendants(projectParentIds);
            const allProjectAccountIds = [...projectParentIds, ...projectSubAccounts.map(a => a.id)];
            const parentIdSet = new Set(allAccounts.filter(a => a.parent_id).map(a => a.parent_id!));
            const leafProjectAccounts = allAccounts.filter(a => allProjectAccountIds.includes(a.id) && !parentIdSet.has(a.id));

            let query = supabase.from('journal_entry_lines').select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, fiscal_year_id)').eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);
            if (selectedFiscalYear) query = query.eq('journal_entry.fiscal_year_id', selectedFiscalYear.id);
            if (leafProjectAccounts.length > 0) query = query.in('account_id', leafProjectAccounts.map(a => a.id));

            const { data: lines } = await query;
            const balanceMap = new Map<string, number>();
            (lines || []).forEach((line: any) => {
              const current = balanceMap.get(line.account_id) || 0;
              balanceMap.set(line.account_id, current + (Number(line.debit) || 0) - (Number(line.credit) || 0));
            });

            const breakdownItems: { label: string; value: number; type?: 'add' | 'subtract' | 'total'; description?: string }[] = leafProjectAccounts.map(a => ({ label: a.name, value: balanceMap.get(a.id) || 0, type: 'add' as const, description: `حساب ${a.code}` })).filter(b => b.value !== 0).sort((a, b) => b.value - a.value);
            const totalCosts = breakdownItems.reduce((sum, b) => sum + b.value, 0);
            breakdownItems.push({ label: 'إجمالي تكاليف المشاريع', value: totalCosts, type: 'total', description: 'من حساب مشاريع تحت التنفيذ' });
            data = { title: getCardLabel(cardId, industryLabels.totalPurchasesLabel), value: formatCurrency(totalCosts), subtitle: 'تفاصيل من شجرة الحسابات - مشاريع تحت التنفيذ', breakdown: breakdownItems, formula: 'إجمالي التكاليف = مجموع أرصدة الحسابات الفرعية تحت حساب المشاريع (1301)', showCarsTable: false };
          } catch {
            const fallbackVal = projectCostAccountId && accountBalances[projectCostAccountId] !== undefined ? accountBalances[projectCostAccountId] : stats.totalPurchases;
            data = { title: getCardLabel(cardId, industryLabels.totalPurchasesLabel), value: formatCurrency(fallbackVal), breakdown: [], showCarsTable: false };
          }
        } else {
          data = { title: getCardLabel(cardId, industryLabels.totalPurchasesLabel), value: formatCurrency(stats.totalPurchases), breakdown: [], cars: buildPurchaseCarDetails(), showCarsTable: true };
        }
        break;
      }
      case 'monthSales':
        data = { title: getCardLabel(cardId, t.dashboard_month_sales), value: formatCurrency(stats.monthSalesAmount), breakdown: [], cars: buildSalesCarDetails(), showCarsTable: true };
        break;
      case 'totalProfit': {
        const profitCars = buildSalesCarDetails();
        const totalProfitValue = profitCars.reduce((sum, c) => sum + (c.profit || 0), 0);
        const totalRevenueValue = profitCars.reduce((sum, c) => sum + (c.salePrice || 0), 0);
        const totalCostValue = profitCars.reduce((sum, c) => sum + c.purchasePrice, 0);
        data = {
          title: getCardLabel(cardId, t.dashboard_total_profit), value: formatCurrency(stats.totalProfit),
          breakdown: [
            { label: t.total_sales_label, value: totalRevenueValue, type: 'add' },
            { label: t.total_purchase_cost, value: totalCostValue, type: 'subtract' },
            { label: t.net_profit, value: totalProfitValue, type: 'total' },
          ],
          cars: profitCars, showCarsTable: true,
        };
        break;
      }
      case 'todaySales': {
        const todayCars = buildSalesCarDetails().filter(c => { if (!c.saleDate) return false; return c.saleDate.startsWith(new Date().toISOString().split('T')[0]); });
        data = { title: getCardLabel(cardId, t.dashboard_today_sales), value: stats.todaySales, breakdown: [], cars: todayCars, showCarsTable: true };
        break;
      }
      case 'monthSalesCount':
        data = { title: getCardLabel(cardId, t.dashboard_month_sales_count), value: stats.monthSales, breakdown: [], cars: buildSalesCarDetails(), showCarsTable: true };
        break;
      case 'allTimePurchases':
        data = { title: getCardLabel(cardId, t.all_time_company_purchases), value: formatCurrency(allTimeStats?.allTimePurchases || 0), subtitle: `${allTimeStats?.totalCarsCount || 0} ${t.unit}`, breakdown: [], cars: buildPurchaseCarDetails(), showCarsTable: true };
        break;
      case 'allTimeSales':
        data = { title: getCardLabel(cardId, t.all_time_company_sales), value: formatCurrency(allTimeStats?.allTimeSales || 0), subtitle: `${allTimeStats?.allTimeSalesCount || 0} ${t.sale_operation}`, breakdown: [], cars: buildSalesCarDetails(), showCarsTable: true };
        break;
      default:
        data = null;
    }

    if (!data) return;
    setDetailData(data);
    setDetailDialogOpen(true);
  }, [
    accountBalances, accountsList, allTimeStats, buildPurchaseCarDetails, buildSalesCarDetails,
    companyId, formatCurrency, getCardConfig, getCardLabel, getCardValue,
    industryLabels, isCarDealership, stats, t, projectCostAccountId, selectedFiscalYear,
    setDetailData, setDetailDialogOpen,
  ]);
}
