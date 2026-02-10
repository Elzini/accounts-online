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

const formSchema = z.object({
  custody_name: z.string().min(1, 'اسم العهدة مطلوب'),
  custody_amount: z.coerce.number().min(1, 'المبلغ مطلوب'),
  custody_date: z.string().min(1, 'التاريخ مطلوب'),
  employee_id: z.string().optional(),
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
  const companyId = useCompanyId();
  const [carriedBalance, setCarriedBalance] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      custody_name: '',
      custody_amount: 0,
      custody_date: new Date().toISOString().split('T')[0],
      employee_id: '',
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
        notes: custody.notes || '',
      });
    } else {
      form.reset({
        custody_name: '',
        custody_amount: 0,
        custody_date: new Date().toISOString().split('T')[0],
        employee_id: '',
        notes: '',
      });
    }
  }, [custody, form]);

  const onSubmit = (values: FormValues) => {
    if (custody) {
      // When updating, only update the editable fields - preserve fiscal_year_id
      const updates = {
        custody_name: values.custody_name,
        custody_amount: values.custody_amount,
        custody_date: values.custody_date,
        employee_id: values.employee_id && values.employee_id !== '__none__' ? values.employee_id : null,
        notes: values.notes || null,
      };
      updateCustody({ id: custody.id, updates });
    } else {
      // When adding, let the hook handle fiscal_year_id
      const data = {
        custody_name: values.custody_name,
        custody_amount: values.custody_amount,
        custody_date: values.custody_date,
        employee_id: values.employee_id && values.employee_id !== '__none__' ? values.employee_id : null,
        notes: values.notes || null,
        status: 'active' as const,
        settlement_date: null,
        created_by: null,
        fiscal_year_id: null,
      };
      addCustody(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{custody ? 'تعديل العهدة' : 'إضافة عهدة جديدة'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="custody_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم العهدة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: عهدة مصاريف نثرية" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
