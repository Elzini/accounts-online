/**
 * Purchase Returns Page - Slim Orchestrator
 * Delegates logic to usePurchaseReturns hook and section components.
 */
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCw, Package, FileText, X } from 'lucide-react';

import { usePurchaseReturns } from './hooks/usePurchaseReturns';
import { ReturnFormTab } from './sections/ReturnFormTab';
import { ReturnListTab } from './sections/ReturnListTab';
import { ReturnDialogs } from './sections/ReturnDialogs';

export function PurchaseReturnsPage() {
  const hook = usePurchaseReturns();
  const { language, activeTab, setActiveTab, foundCar, foundInvoice, returns, resetForm, formatCurrency } = hook;

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4" dir="rtl">
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-l from-violet-600 via-purple-500 to-fuchsia-500 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 opacity-80" />
                  <h1 className="text-lg font-bold tracking-wide">
                    {language === 'ar' ? 'مرتجع مشتريات / إشعار مدين' : 'Purchase Returns / Debit Note'}
                  </h1>
                </div>
                {(foundCar || foundInvoice) && (
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold shadow-sm bg-white text-violet-700">
                    {foundCar
                      ? (language === 'ar' ? `مخزون #${foundCar.inventory_number}` : `Inv #${foundCar.inventory_number}`)
                      : (language === 'ar' ? `فاتورة #${foundInvoice?.invoice_number}` : `Invoice #${foundInvoice?.invoice_number}`)}
                  </span>
                )}
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-white/15 backdrop-blur-sm h-8">
                  <TabsTrigger value="form" className="text-[11px] text-white data-[state=active]:bg-white data-[state=active]:text-violet-700 h-7 px-3">
                    {language === 'ar' ? 'بيانات أساسية' : 'Basic Data'}
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-[11px] text-white data-[state=active]:bg-white data-[state=active]:text-violet-700 h-7 px-3">
                    {language === 'ar' ? 'السجلات' : 'Records'} ({returns.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Found item banners */}
          {foundCar && (
            <div className="bg-violet-50 dark:bg-violet-900/20 border-b-2 border-violet-200 dark:border-violet-800 px-5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-violet-800 dark:text-violet-200 block">{foundCar.name} {foundCar.model} - {foundCar.color} - شاسيه: {foundCar.chassis_number}</span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400">
                    {language === 'ar' ? `المورد: ${foundCar.supplier?.name || '-'} | سعر الشراء: ${formatCurrency(foundCar.purchase_price)} ريال` : `Supplier: ${foundCar.supplier?.name} | Price: ${formatCurrency(foundCar.purchase_price)}`}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-violet-600 hover:bg-violet-100" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          )}

          {foundInvoice && (
            <div className="bg-violet-50 dark:bg-violet-900/20 border-b-2 border-violet-200 dark:border-violet-800 px-5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-violet-800 dark:text-violet-200 block">
                    {language === 'ar' ? `فاتورة مشتريات رقم ${foundInvoice.invoice_number}` : `Purchase Invoice #${foundInvoice.invoice_number}`}
                  </span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400">
                    {language === 'ar'
                      ? `المورد: ${foundInvoice.supplier_name} | الإجمالي: ${formatCurrency(foundInvoice.total)} ريال | التاريخ: ${foundInvoice.invoice_date}`
                      : `Supplier: ${foundInvoice.supplier_name} | Total: ${formatCurrency(foundInvoice.total)} | Date: ${foundInvoice.invoice_date}`}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-violet-600 hover:bg-violet-100" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          )}

          {activeTab === 'form' && <ReturnFormTab hook={hook} />}
          {activeTab === 'list' && <ReturnListTab hook={hook} />}
        </div>
      </div>

      <ReturnDialogs hook={hook} />
    </>
  );
}
