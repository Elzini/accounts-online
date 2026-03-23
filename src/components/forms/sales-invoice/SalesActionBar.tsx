/**
 * Sales Invoice - Action Bar (bottom menus & buttons)
 */
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Save, Plus, X, Printer, FileText, Trash2, FileSpreadsheet, ChevronDown, MessageSquare, RotateCcw, CheckCircle, FileEdit, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ActivePage } from '@/types';
import type { useSalesInvoiceData } from './useSalesInvoiceData';

type HookReturn = ReturnType<typeof useSalesInvoiceData>;

interface SalesActionBarProps {
  hook: HookReturn;
  setActivePage: (page: ActivePage) => void;
}

export function SalesActionBar({ hook, setActivePage }: SalesActionBarProps) {
  const {
    isViewingExisting, isApproved, isEditing, setIsEditing, currentSaleStatus,
    handleSubmit, handleUpdateSale, handleNewInvoice, handlePrintExisting,
    setDeleteDialogOpen, setReverseDialogOpen, setApproveDialogOpen,
    addMultiCarSale, updateSale, deleteSale, approveSale, searchBarRef, t,
  } = hook;

  return (
    <div className="border-t-2 border-emerald-100 dark:border-emerald-900 bg-gradient-to-b from-card to-muted/30">
      {/* Quick Menu Row */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50 overflow-x-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-8 rounded-lg hover:bg-muted">
              عمليات الضرائب <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setActivePage('vat-return-report')}>
              <FileText className="w-3.5 h-3.5 ml-2" /> إنشاء إقرار ضريبي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivePage('tax-settings')}>
              <FileSpreadsheet className="w-3.5 h-3.5 ml-2" /> إعدادات الضريبة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-8 rounded-lg hover:bg-muted">
              تقارير <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setActivePage('sales-report')}><FileText className="w-3.5 h-3.5 ml-2" /> تقرير المبيعات</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivePage('profit-report')}><FileText className="w-3.5 h-3.5 ml-2" /> تقرير الأرباح</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivePage('account-statement')}><FileText className="w-3.5 h-3.5 ml-2" /> كشف حساب</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-8 rounded-lg hover:bg-muted">
              {t.inv_operations || 'عمليات'} <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setActivePage('medad-import')}><FileSpreadsheet className="w-3.5 h-3.5 ml-2" /> {t.inv_import_data}</DropdownMenuItem>
            <DropdownMenuItem disabled={!isViewingExisting || isApproved} onClick={() => setReverseDialogOpen(true)} className="text-amber-600">
              <RotateCcw className="w-3.5 h-3.5 ml-2" /> {t.inv_return}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('سيتم إضافة خاصية إرسال SMS قريباً')}>
              <MessageSquare className="w-3.5 h-3.5 ml-2" /> إرسال SMS
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-8 rounded-lg hover:bg-muted">
              عرض <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handlePrintExisting} disabled={!isViewingExisting}>
              <Printer className="w-3.5 h-3.5 ml-2" /> معاينة قبل الطباعة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivePage('journal-entries')} disabled={!isViewingExisting || !isApproved}>
              <FileText className="w-3.5 h-3.5 ml-2" /> عرض القيد المحاسبي
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Primary Action Buttons */}
      <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
        {isViewingExisting ? (
          <>
            {!isApproved && isEditing && (
              <Button onClick={handleUpdateSale} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" disabled={updateSale.isPending}>
                <Save className="w-3.5 h-3.5" /> {updateSale.isPending ? t.inv_saving : t.inv_save_changes}
              </Button>
            )}
            {isApproved && (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 h-9">
                <CheckCircle className="w-3.5 h-3.5" /><span className="text-xs font-semibold">{t.inv_status_approved}</span>
              </div>
            )}
          </>
        ) : (
          <Button onClick={handleSubmit} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" disabled={addMultiCarSale.isPending}>
            <Plus className="w-3.5 h-3.5" /> {addMultiCarSale.isPending ? t.inv_saving : 'إضافة'}
          </Button>
        )}

        <Button variant="outline" onClick={handleNewInvoice} size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm">
          <FileText className="w-3.5 h-3.5 text-emerald-600" /> جديد
        </Button>

        <Button variant="outline" size="sm"
          className={`gap-1.5 text-xs h-9 rounded-lg shadow-sm ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400' : ''}`}
          disabled={!isViewingExisting || isApproved}
          onClick={() => { setIsEditing(!isEditing); if (!isEditing) toast.info('تم تفعيل وضع التعديل'); }}>
          <FileEdit className="w-3.5 h-3.5" /> {isEditing ? 'إلغاء التعديل' : 'تعديل'}
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" disabled={!isViewingExisting || isApproved} onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" /> حذف
        </Button>

        <Button variant="outline" size="sm"
          className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 shadow-sm"
          disabled={!isViewingExisting || isApproved} onClick={() => setApproveDialogOpen(true)}>
          <CheckCircle className="w-3.5 h-3.5" /> محاسبة
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm"
          onClick={() => { searchBarRef.current?.scrollIntoView({ behavior: 'smooth' }); const input = searchBarRef.current?.querySelector('input'); if (input) setTimeout(() => input.focus(), 300); }}>
          <Search className="w-3.5 h-3.5 text-muted-foreground" /> بحث
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-sm"
          disabled={!isViewingExisting} onClick={handlePrintExisting}>
          <Printer className="w-3.5 h-3.5 text-emerald-600" /> طباعة
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm">
              مزيد.. <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setActivePage('medad-import')}><FileSpreadsheet className="w-3.5 h-3.5 ml-2" /> {t.inv_import_data}</DropdownMenuItem>
            <DropdownMenuItem disabled={!isViewingExisting || isApproved} onClick={() => setReverseDialogOpen(true)} className="text-amber-600">
              <RotateCcw className="w-3.5 h-3.5 ml-2" /> {t.inv_return}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivePage('installments')}><FileText className="w-3.5 h-3.5 ml-2" /> الأقساط</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={() => setActivePage('sales')} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 shadow-sm">
          <X className="w-3.5 h-3.5" /> إغلاق
        </Button>
      </div>
    </div>
  );
}
