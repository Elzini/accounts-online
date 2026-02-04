import { useEffect } from 'react';
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
import { Custody } from '@/services/custody';

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
    const data = {
      custody_name: values.custody_name,
      custody_amount: values.custody_amount,
      custody_date: values.custody_date,
      employee_id: values.employee_id || null,
      notes: values.notes || null,
      status: 'active' as const,
      settlement_date: null,
      created_by: null,
      fiscal_year_id: null,
    };

    if (custody) {
      updateCustody({ id: custody.id, updates: data });
    } else {
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
                      <SelectItem value="">بدون تحديد</SelectItem>
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
