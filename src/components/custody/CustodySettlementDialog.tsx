import { useState } from 'react';
import { Plus, Trash2, FileDown, Printer, CheckCircle, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { useCustodyDetails, useCustody } from '@/hooks/useCustody';
import { calculateCustodySummary } from '@/services/custody';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';
import { useCustodyExport } from './useCustodyExport';
import { CustodyPrintPreviewDialog } from './CustodyPrintPreviewDialog';

const transactionSchema = z.object({
  transaction_date: z.string().min(1, 'التاريخ مطلوب'),
  description: z.string().min(1, 'البيان مطلوب'),
  analysis_category: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'المبلغ مطلوب'),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface CustodySettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custodyId: string;
}

export function CustodySettlementDialog({ open, onOpenChange, custodyId }: CustodySettlementDialogProps) {
  const { custody, isLoading, addTransaction, deleteTransaction, isAddingTransaction } = useCustodyDetails(custodyId);
  const { settleCustody, isSettling } = useCustody();
  const { exportToExcel } = useCustodyExport();
  const [showForm, setShowForm] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      analysis_category: '',
      amount: 0,
    },
  });

  if (isLoading || !custody) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <div className="text-center py-8">جاري التحميل...</div>
        </DialogContent>
      </Dialog>
    );
  }

  const summary = calculateCustodySummary(custody);
  const transactions = custody.transactions || [];

  const onSubmitTransaction = (values: TransactionFormValues) => {
    addTransaction({
      transaction_date: values.transaction_date,
      description: values.description,
      analysis_category: values.analysis_category || null,
      amount: values.amount,
      account_id: null,
      notes: null,
      created_by: null,
    });
    form.reset({
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      analysis_category: '',
      amount: 0,
    });
    setShowForm(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      deleteTransaction(id);
    }
  };

  const handleSettle = () => {
    const confirmMsg = summary.carriedBalance > 0
      ? `هل أنت متأكد من تصفية هذه العهدة؟ سيتم ترحيل مبلغ ${formatNumber(summary.carriedBalance)} ر.س إلى عهدة جديدة باسم ${custody.employee?.name || custody.custody_name}. لن يمكن التعديل عليها بعد التصفية.`
      : 'هل أنت متأكد من تصفية هذه العهدة؟ لن يمكن التعديل عليها بعد التصفية.';
    
    if (confirm(confirmMsg)) {
      settleCustody({
        id: custodyId,
        settlementDate: new Date().toISOString().split('T')[0],
        carriedBalance: summary.carriedBalance,
        employeeId: custody.employee_id,
        employeeName: custody.employee?.name || custody.custody_name,
      });
    }
  };

  const handleOpenPrintPreview = () => {
    setShowPrintPreview(true);
  };

  const handleExportExcel = () => {
    exportToExcel(custody, summary);
  };

  const isSettled = custody.status === 'settled';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تصفية العهدة - {custody.custody_name}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenPrintPreview}>
                <Eye className="h-4 w-4 ml-1" />
                معاينة PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileDown className="h-4 w-4 ml-1" />
                Excel
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Custody Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.isCarried ? (
            <>
              <Card className="col-span-2 md:col-span-4">
                <CardContent className="pt-4 text-center">
                  <div className="text-sm text-muted-foreground">رصيد مرحّل (مستحق للموظف)</div>
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(summary.carriedBalance)} ر.س</div>
                  <div className="text-xs text-muted-foreground mt-1">سيتم خصمه تلقائياً من العهدة التالية</div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">مبلغ العهدة</div>
                  <div className="text-xl font-bold text-primary">{formatNumber(summary.custodyAmount)} ر.س</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">إجمالي المصروفات</div>
                  <div className="text-xl font-bold text-red-600">{formatNumber(summary.totalSpent)} ر.س</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">المبلغ المردود</div>
                  <div className="text-xl font-bold text-green-600">{formatNumber(summary.returnedAmount)} ر.س</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">الرصيد المرحل</div>
                  <div className="text-xl font-bold text-orange-600">{formatNumber(summary.carriedBalance)} ر.س</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10">
                  <TableHead className="text-right font-bold">التاريخ</TableHead>
                  <TableHead className="text-right font-bold">التحليل</TableHead>
                  <TableHead className="text-right font-bold">البيان</TableHead>
                  <TableHead className="text-right font-bold">القيمة</TableHead>
                  {!isSettled && <TableHead className="text-right font-bold w-16">حذف</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSettled ? 4 : 5} className="text-center py-8 text-muted-foreground">
                      لا توجد مصروفات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.transaction_date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>{tx.analysis_category || '-'}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className="font-medium">{formatNumber(tx.amount)}</TableCell>
                      {!isSettled && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive h-8 w-8 p-0"
                            onClick={() => handleDeleteTransaction(tx.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="text-right font-bold">الإجمالي</TableCell>
                  <TableCell className="font-bold text-primary">{formatNumber(summary.totalSpent)}</TableCell>
                  {!isSettled && <TableCell />}
                </TableRow>
                <TableRow className="bg-green-50">
                  <TableCell colSpan={3} className="text-right font-bold">المبلغ المردود</TableCell>
                  <TableCell className="font-bold text-green-600">{formatNumber(summary.returnedAmount)}</TableCell>
                  {!isSettled && <TableCell />}
                </TableRow>
                <TableRow className="bg-orange-50">
                  <TableCell colSpan={3} className="text-right font-bold">الرصيد المرحل</TableCell>
                  <TableCell className="font-bold text-orange-600">{formatNumber(summary.carriedBalance)}</TableCell>
                  {!isSettled && <TableCell />}
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* Add Transaction Form */}
        {!isSettled && (
          <>
            {showForm ? (
              <Card>
                <CardContent className="pt-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitTransaction)} className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="transaction_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>التاريخ</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="analysis_category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>التحليل</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: مصروف كهرباء" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>البيان</FormLabel>
                              <FormControl>
                                <Input placeholder="وصف المصروف" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>القيمة</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit" disabled={isAddingTransaction}>
                          إضافة المصروف
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة مصروف
              </Button>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          {!isSettled && (
            <Button onClick={handleSettle} disabled={isSettling} className="gap-2 bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4" />
              تصفية العهدة
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Print Preview Dialog */}
      <CustodyPrintPreviewDialog
        open={showPrintPreview}
        onOpenChange={setShowPrintPreview}
        custody={custody}
        summary={summary}
      />
    </Dialog>
  );
}
