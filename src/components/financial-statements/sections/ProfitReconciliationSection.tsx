/**
 * Financial Statements - Profit Reconciliation Section
 * Shows journal-based vs sales-based profit comparison for car dealerships
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calculator, BookOpen, TrendingUp, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { useFinancialStatements } from '../hooks/useFinancialStatements';

type Hook = ReturnType<typeof useFinancialStatements>;

interface Props {
  hook: Hook;
}

export function ProfitReconciliationSection({ hook }: Props) {
  const { data, isCarDealership, profitReportData, isFixingCogs, handleFixMissingCogs, formatCurrency, currencySymbol } = hook;

  return (
    <Card className="mt-4 border-2 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {isCarDealership ? 'تسوية صافي الربح (مقارنة المصادر)' : 'صافي الربح من القيود المحاسبية'}
          </div>
          {isCarDealership && (
            <Button variant="outline" size="sm" onClick={handleFixMissingCogs} disabled={isFixingCogs} className="gap-2">
              <Wrench className="w-4 h-4" />
              {isFixingCogs ? 'جاري الإصلاح...' : 'إصلاح القيود الناقصة'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCarDealership ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <JournalProfitCard data={data} formatCurrency={formatCurrency} currencySymbol={currencySymbol} />
              <SalesProfitCard profitReportData={profitReportData} formatCurrency={formatCurrency} currencySymbol={currencySymbol} />
            </div>
            <div className="mt-4 flex items-center justify-between p-3 rounded-lg border-2">
              <div className="flex items-center gap-2">
                {Math.abs(data.incomeStatement.netProfit - profitReportData.netProfit) < 1 ? (
                  <><CheckCircle2 className="w-5 h-5 text-green-600" /><span className="font-semibold text-green-600">الأرقام متطابقة ✓</span></>
                ) : (
                  <><AlertTriangle className="w-5 h-5 text-amber-600" /><span className="text-amber-600">الفرق: {formatCurrency(data.incomeStatement.netProfit - profitReportData.netProfit)} {currencySymbol}</span></>
                )}
              </div>
            </div>
          </>
        ) : (
          <JournalProfitCard data={data} formatCurrency={formatCurrency} currencySymbol={currencySymbol} fullWidth />
        )}
      </CardContent>
    </Card>
  );
}

function JournalProfitCard({ data, formatCurrency, currencySymbol, fullWidth }: { data: any; formatCurrency: (n: number) => string; currencySymbol: string; fullWidth?: boolean }) {
  return (
    <div className={`p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30`}>
      <h4 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" />صافي الربح من القيود المحاسبية</h4>
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between"><span>إجمالي الإيرادات</span><span>{formatCurrency(data.incomeStatement.revenue)} {currencySymbol}</span></div>
        <div className="flex justify-between text-destructive"><span>(-) تكلفة المبيعات</span><span>({formatCurrency(Math.abs(data.incomeStatement.costOfRevenue))})</span></div>
        <Separator />
        <div className="flex justify-between font-semibold"><span>مجمل الربح</span><span>{formatCurrency(data.incomeStatement.revenue - Math.abs(data.incomeStatement.costOfRevenue))} {currencySymbol}</span></div>
        <div className="flex justify-between text-destructive"><span>(-) المصاريف التشغيلية</span><span>({formatCurrency(Math.abs(data.incomeStatement.generalAndAdminExpenses))})</span></div>
      </div>
      <div className="flex justify-between font-bold text-lg border-t pt-2">
        <span>صافي الربح</span>
        <span className={`${fullWidth ? 'text-2xl ' : ''}${data.incomeStatement.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
          {formatCurrency(data.incomeStatement.netProfit)} {currencySymbol}
        </span>
      </div>
    </div>
  );
}

function SalesProfitCard({ profitReportData, formatCurrency, currencySymbol }: { profitReportData: any; formatCurrency: (n: number) => string; currencySymbol: string }) {
  return (
    <div className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
      <h4 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />صافي الربح من تقرير الأرباح (المبيعات)</h4>
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between"><span>إجمالي الربح (سعر البيع - سعر الشراء)</span><span>{formatCurrency(profitReportData.totalGrossProfit)} {currencySymbol}</span></div>
        <div className="flex justify-between text-destructive"><span>(-) مصاريف السيارات المباعة</span><span>({formatCurrency(profitReportData.carExpenses)})</span></div>
        <div className="flex justify-between text-destructive"><span>(-) المصاريف العامة</span><span>({formatCurrency(profitReportData.generalExpenses)})</span></div>
      </div>
      <div className="flex justify-between font-bold text-lg border-t pt-2">
        <span>صافي الربح</span>
        <span className={profitReportData.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}>{formatCurrency(profitReportData.netProfit)} {currencySymbol}</span>
      </div>
    </div>
  );
}
