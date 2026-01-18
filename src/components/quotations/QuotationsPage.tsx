import { useState } from 'react';
import { Plus, FileText, Trash2, Eye, Send, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuotations, useAddQuotation, useDeleteQuotation, useUpdateQuotation } from '@/hooks/useQuotations';
import { useCustomers, useCars } from '@/hooks/useDatabase';
import { useCompany } from '@/contexts/CompanyContext';
import { Quotation } from '@/services/quotations';

export function QuotationsPage() {
  const { companyId } = useCompany();
  const { data: quotations = [], isLoading } = useQuotations();
  const { data: customers = [] } = useCustomers();
  const { data: cars = [] } = useCars();
  const addQuotation = useAddQuotation();
  const deleteQuotation = useDeleteQuotation();
  const updateQuotation = useUpdateQuotation();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [form, setForm] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    valid_until: '',
    notes: '',
    items: [{ car_id: '', description: '', quantity: 1, unit_price: 0 }]
  });

  const availableCars = cars.filter(car => car.status === 'available');

  const calculateTotals = () => {
    const total = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    return { total_amount: total, final_amount: total };
  };

  const handleAddItem = () => {
    setForm({
      ...form,
      items: [...form.items, { car_id: '', description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If car selected, auto-fill details
    if (field === 'car_id' && value) {
      const car = cars.find(c => c.id === value);
      if (car) {
        newItems[index].description = `${car.name} - ${car.model || ''} (${car.chassis_number})`;
        newItems[index].unit_price = Number(car.purchase_price) * 1.1; // 10% markup suggestion
      }
    }
    
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async () => {
    if (form.items.length === 0 || !form.items[0].description) {
      toast.error('يرجى إضافة بند واحد على الأقل');
      return;
    }

    const totals = calculateTotals();
    
    try {
      await addQuotation.mutateAsync({
        quotation: {
          company_id: companyId!,
          customer_id: form.customer_id || null,
          customer_name: form.customer_name || null,
          customer_phone: form.customer_phone || null,
          total_amount: totals.total_amount,
          discount: 0,
          tax_amount: 0,
          final_amount: totals.final_amount,
          status: 'draft',
          valid_until: form.valid_until || null,
          notes: form.notes || null,
          created_by: null
        },
        items: form.items.map(item => ({
          car_id: item.car_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        }))
      });
      toast.success('تم إنشاء عرض السعر بنجاح');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء عرض السعر');
    }
  };

  const resetForm = () => {
    setForm({
      customer_id: '',
      customer_name: '',
      customer_phone: '',
      valid_until: '',
      notes: '',
      items: [{ car_id: '', description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف عرض السعر؟')) return;
    try {
      await deleteQuotation.mutateAsync(id);
      toast.success('تم حذف عرض السعر');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleSend = async (id: string) => {
    try {
      await updateQuotation.mutateAsync({ id, data: { status: 'sent' } });
      toast.success('تم تحديث حالة العرض');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">مسودة</Badge>;
      case 'sent':
        return <Badge variant="default">مُرسل</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">مقبول</Badge>;
      case 'rejected':
        return <Badge variant="destructive">مرفوض</Badge>;
      case 'converted':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">تم التحويل لبيع</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العروض</p>
                <p className="text-2xl font-bold">{quotations.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مسودات</p>
                <p className="text-2xl font-bold">{quotations.filter(q => q.status === 'draft').length}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مُرسلة</p>
                <p className="text-2xl font-bold">{quotations.filter(q => q.status === 'sent').length}</p>
              </div>
              <Send className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مقبولة</p>
                <p className="text-2xl font-bold">{quotations.filter(q => q.status === 'accepted').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Table */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">عروض الأسعار</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" /> عرض سعر جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء عرض سعر</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اختر عميل موجود</Label>
                  <Select 
                    value={form.customer_id} 
                    onValueChange={(v) => {
                      const customer = customers.find(c => c.id === v);
                      setForm({
                        ...form, 
                        customer_id: v,
                        customer_name: customer?.name || '',
                        customer_phone: customer?.phone || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>أو أدخل اسم العميل</Label>
                  <Input
                    value={form.customer_name}
                    onChange={(e) => setForm({...form, customer_name: e.target.value})}
                    placeholder="اسم العميل"
                  />
                </div>
                <div>
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={form.customer_phone}
                    onChange={(e) => setForm({...form, customer_phone: e.target.value})}
                    placeholder="05xxxxxxxx"
                  />
                </div>
                <div>
                  <Label>صالح حتى</Label>
                  <Input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({...form, valid_until: e.target.value})}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label className="text-lg">البنود</Label>
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted rounded-lg">
                    <div className="col-span-3">
                      <Label className="text-xs">السيارة</Label>
                      <Select 
                        value={item.car_id} 
                        onValueChange={(v) => handleItemChange(index, 'car_id', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCars.map(car => (
                            <SelectItem key={car.id} value={car.id}>
                              {car.name} - {car.chassis_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">الوصف</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="وصف البند"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">السعر</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={form.items.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={handleAddItem} className="w-full">
                  <Plus className="w-4 h-4 ml-2" /> إضافة بند
                </Button>
              </div>

              {/* Totals */}
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between text-lg font-semibold">
                  <span>الإجمالي:</span>
                  <span>{formatCurrency(totals.final_amount)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={addQuotation.isPending}>
                {addQuotation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                حفظ عرض السعر
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم العرض</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>صالح حتى</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد عروض أسعار
                  </TableCell>
                </TableRow>
              ) : (
                quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell>#{quotation.quotation_number}</TableCell>
                    <TableCell>{quotation.customer?.name || quotation.customer_name || '-'}</TableCell>
                    <TableCell>{new Date(quotation.created_at).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>
                      {quotation.valid_until 
                        ? new Date(quotation.valid_until).toLocaleDateString('ar-SA')
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(quotation.final_amount))}
                    </TableCell>
                    <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {quotation.status === 'draft' && (
                          <Button variant="ghost" size="icon" onClick={() => handleSend(quotation.id)}>
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(quotation.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
