import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCustody } from '@/hooks/useCustody';
import { useEmployees } from '@/hooks/usePayroll';
import { Custody, getEmployeeCarriedBalance } from '@/services/custody';
import { useCompanyId } from '@/hooks/useCompanyId';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { AccountSearchSelect } from '@/components/accounting/AccountSearchSelect';
import { useAccounts } from '@/hooks/useAccounting';

const formSchema = z.object({
  custody_name: z.string().min(1, 'اسم العهدة مطلوب'),
  custody_amount: z.coerce.number().min(1, 'المبلغ مطلوب'),
  custody_date: z.string().min(1, 'التاريخ مطلوب'),
  employee_id: z.string().optional(),
  custody_account_id: z.string().optional(),
  cash_account_id: z.string().optional(),
  custody_type: z.enum(['custody', 'advance']).default('custody'),
  installment_amount: z.coerce.number().optional(),
  installment_count: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustodyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custody: Custody | null;
}

export function CustodyFormDialog({ open, onOpenChange, custody }: CustodyFormDialogProps) {
  const { addCustody, updateCustody, isAdding, isUpdating } = useCustody();
  const { data: employees = [] } = useEmployees();
  const { data: accounts = [] } = useAccounts();
  const companyId = useCompanyId();
  const [carriedBalance, setCarriedBalance] = useState(0);

  const accountsList = accounts.map((a: any) => ({ id: a.id, code: a.code, name: a.name }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      custody_name: '',
      custody_amount: 0,
      custody_date: new Date().toISOString().split('T')[0],
      employee_id: '',
      custody_account_id: '',
      cash_account_id: '',
      custody_type: 'custody',
      installment_amount: 0,
      installment_count: 1,
      notes: '',
    },
  });

  // Check carried balance when employee changes
  const watchedEmployeeId = form.watch('employee_id');
  useEffect(() => {
    if (watchedEmployeeId && watchedEmployeeId !== '__none__' && companyId && !custody) {
      getEmployeeCarriedBalance(companyId, watchedEmployeeId).then(setCarriedBalance);
    } else {
      setCarriedBalance(0);
    }
  }, [watchedEmployeeId, companyId, custody]);

  useEffect(() => {
    if (custody) {
      form.reset({
        custody_name: custody.custody_name,
        custody_amount: custody.custody_amount,
        custody_date: custody.custody_date,
        employee_id: custody.employee_id || '',
        custody_account_id: custody.custody_account_id || '',
        cash_account_id: custody.cash_account_id || '',
        custody_type: custody.custody_type || 'custody',
        installment_amount: custody.installment_amount || 0,
        installment_count: custody.installment_count || 1,
        notes: custody.notes || '',
      });
    } else {
      form.reset({
        custody_name: '',
        custody_amount: 0,
        custody_date: new Date().toISOString().split('T')[0],
        employee_id: '',
        custody_account_id: '',
        cash_account_id: '',
        custody_type: 'custody',
        installment_amount: 0,
        installment_count: 1,
        notes: '',
      });
    }
  }, [custody, form]);

  const watchedType = form.watch('custody_type');

  // Auto-set name for advance type
  useEffect(() => {
    if (watchedType === 'advance' && !custody) {
      const emp = employees.find(e => e.id === watchedEmployeeId);
      if (emp) {
        form.setValue('custody_name', `سلفة - ${emp.name}`);
      }
    }
  }, [watchedType, watchedEmployeeId, employees, custody, form]);

  const onSubmit = (values: FormValues) => {
    if (values.custody_type === 'advance' && (!values.employee_id || values.employee_id === '__none__')) {
      form.setError('employee_id', { message: 'يجب تحديد الموظف للسلفة' });
      return;
    }

    if (custody) {
      const updates = {
        custody_name: values.custody_name,
        custody_amount: values.custody_amount,
        custody_date: values.custody_date,
        employee_id: values.employee_id && values.employee_id !== '__none__' ? values.employee_id : null,
        custody_account_id: values.custody_account_id || null,
        cash_account_id: values.cash_account_id || null,
        custody_type: values.custody_type,
        installment_amount: values.installment_amount || 0,
        installment_count: values.installment_count || 1,
        notes: values.notes || null,
      };
      updateCustody({ id: custody.id, updates });
    } else {
      const data = {
        custody_name: values.custody_name,
        custody_amount: values.custody_amount,
        custody_date: values.custody_date,
        employee_id: values.employee_id && values.employee_id !== '__none__' ? values.employee_id : null,
        custody_account_id: values.custody_account_id || null,
        cash_account_id: values.cash_account_id || null,
        custody_type: values.custody_type,
        advance_id: null,
        installment_amount: values.installment_amount || 0,
        installment_count: values.installment_count || 1,
        notes: values.notes || null,
        status: 'active' as const,
        settlement_date: null,
        created_by: null,
        fiscal_year_id: null,
        journal_entry_id: null,
      };
      addCustody(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{custody ? (watchedType === 'advance' ? 'تعديل السلفة' : 'تعديل العهدة') : (watchedType === 'advance' ? 'إضافة سلفة جديدة' : 'إضافة عهدة جديدة')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Type Selection */}
            <FormField
              control={form.control}
              name="custody_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>النوع</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!custody}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="custody">عهدة</SelectItem>
                      <SelectItem value="advance">سلفة موظف</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="custody_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{watchedType === 'advance' ? 'اسم السلفة' : 'اسم العهدة'}</FormLabel>
                  <FormControl>
                    <Input placeholder={watchedType === 'advance' ? 'مثال: سلفة شخصية' : 'مثال: عهدة مصاريف نثرية'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="custody_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ العهدة</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custody_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ العهدة</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المستلم (اختياري)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف المستلم" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">بدون تحديد</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {carriedBalance > 0 && !custody && (
              <Alert className="border-blue-300 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  <p>هذا الموظف لديه رصيد مرحّل (دين على الشركة) بقيمة <strong>{formatNumber(carriedBalance)} ر.س</strong>.</p>
                  {form.watch('custody_amount') > 0 && carriedBalance >= form.watch('custody_amount') && (
                    <p className="mt-1 text-destructive font-semibold">
                      مبلغ العهدة ({formatNumber(form.watch('custody_amount'))}) أقل من المرحّل ({formatNumber(carriedBalance)}) → سيبقى دين {formatNumber(carriedBalance - form.watch('custody_amount'))} ر.س
                    </p>
                  )}
                  {form.watch('custody_amount') > 0 && carriedBalance < form.watch('custody_amount') && (
                    <p className="mt-1">
                      سيتم خصم {formatNumber(carriedBalance)} ر.س → صافي العهدة الجديدة: <strong>{formatNumber(form.watch('custody_amount') - carriedBalance)} ر.س</strong>
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Installment fields for advance type */}
            {watchedType === 'advance' && (
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <p className="text-sm font-semibold text-foreground">إعدادات الأقساط (خصم من الراتب)</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="installment_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عدد الأقساط</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={(e) => {
                            field.onChange(e);
                            const count = Number(e.target.value) || 1;
                            const amount = form.getValues('custody_amount');
                            if (count > 0 && amount > 0) {
                              form.setValue('installment_amount', Math.round((amount / count) * 100) / 100);
                            }
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="installment_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مبلغ القسط الشهري</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">سيتم خصم مبلغ القسط تلقائياً من مسير الراتب الشهري</p>
              </div>
            )}

            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <p className="text-sm font-semibold text-foreground">ربط الحسابات (لإنشاء قيد تلقائي)</p>
              
              <FormField
                control={form.control}
                name="custody_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{watchedType === 'advance' ? 'حساب السلف (مدين)' : 'حساب العهدة (مدين)'}</FormLabel>
                    <FormControl>
                      <AccountSearchSelect
                        accounts={accountsList}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder={watchedType === 'advance' ? 'مثال: سلف الموظفين' : 'مثال: عهد الموظفين'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cash_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حساب الدفع (دائن)</FormLabel>
                    <FormControl>
                      <AccountSearchSelect
                        accounts={accountsList}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="مثال: الصندوق أو البنك"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea placeholder="ملاحظات إضافية..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isAdding || isUpdating}>
                {custody ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
