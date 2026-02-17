import { useState, useMemo } from 'react';
import { Receipt, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVouchers } from '@/hooks/useVouchers';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { VoucherFormView } from './VoucherFormView';

export function VouchersPage() {
  const { t, language } = useLanguage();
  const { data: allVouchers = [], isLoading } = useVouchers();
  const { filterByFiscalYear } = useFiscalYearFilter();

  const filteredVouchers = useMemo(() => {
    return filterByFiscalYear(allVouchers, 'voucher_date');
  }, [allVouchers, filterByFiscalYear]);

  const receiptCount = filteredVouchers.filter(v => v.voucher_type === 'receipt').length;
  const paymentCount = filteredVouchers.filter(v => v.voucher_type === 'payment').length;

  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const totalReceipts = filteredVouchers.filter(v => v.voucher_type === 'receipt').reduce((s, v) => s + Number(v.amount), 0);
  const totalPayments = filteredVouchers.filter(v => v.voucher_type === 'payment').reduce((s, v) => s + Number(v.amount), 0);
  const formatCurrency = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR' }).format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.voucher_total_receipts}</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceipts)}</p>
              </div>
              <Receipt className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.voucher_total_payments}</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalPayments)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.voucher_net}</p>
                <p className={`text-2xl font-bold ${totalReceipts - totalPayments >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(totalReceipts - totalPayments)}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Receipt / Payment */}
      <Tabs defaultValue="receipt" className="w-full">
        <TabsList>
          <TabsTrigger value="receipt" className="gap-2">
            <Receipt className="w-4 h-4" /> سند قبض ({receiptCount})
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="w-4 h-4" /> سند صرف ({paymentCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipt" className="mt-4">
          <VoucherFormView type="receipt" />
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <VoucherFormView type="payment" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
