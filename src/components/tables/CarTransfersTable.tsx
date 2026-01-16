import { useState } from 'react';
import { Plus, Edit, Trash2, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCarTransfers, useAddCarTransfer, useUpdateCarTransfer, useDeleteCarTransfer, usePartnerDealerships } from '@/hooks/useTransfers';
import { useCars } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ActivePage } from '@/types';
import { CarTransfer } from '@/services/transfers';
import { format } from 'date-fns';

interface CarTransfersTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function CarTransfersTable({ setActivePage }: CarTransfersTableProps) {
  const { data: transfers, isLoading } = useCarTransfers();
  const { data: dealerships } = usePartnerDealerships();
  const { data: cars } = useCars();
  const addMutation = useAddCarTransfer();
  const updateMutation = useUpdateCarTransfer();
  const deleteMutation = useDeleteCarTransfer();
  const { permissions } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<CarTransfer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    car_id: '',
    partner_dealership_id: '',
    transfer_type: 'outgoing' as 'outgoing' | 'incoming',
    transfer_date: format(new Date(), 'yyyy-MM-dd'),
    return_date: '',
    agreed_commission: 0,
    commission_percentage: 0,
    status: 'pending' as 'pending' | 'sold' | 'returned',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      car_id: '',
      partner_dealership_id: '',
      transfer_type: 'outgoing',
      transfer_date: format(new Date(), 'yyyy-MM-dd'),
      return_date: '',
      agreed_commission: 0,
      commission_percentage: 0,
      status: 'pending',
      notes: '',
    });
  };

  const handleAdd = async () => {
    if (!formData.car_id || !formData.partner_dealership_id) {
      toast.error('يرجى اختيار السيارة والمعرض');
      return;
    }

    try {
      await addMutation.mutateAsync({
        car_id: formData.car_id,
        partner_dealership_id: formData.partner_dealership_id,
        transfer_type: formData.transfer_type,
        transfer_date: formData.transfer_date,
        return_date: formData.return_date || null,
        agreed_commission: formData.agreed_commission,
        commission_percentage: formData.commission_percentage,
        status: formData.status,
        notes: formData.notes || null,
      });
      toast.success('تم إضافة التحويل بنجاح');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة التحويل');
    }
  };

  const handleUpdate = async () => {
    if (!editingTransfer) return;

    try {
      await updateMutation.mutateAsync({
        id: editingTransfer.id,
        data: {
          car_id: formData.car_id,
          partner_dealership_id: formData.partner_dealership_id,
          transfer_type: formData.transfer_type,
          transfer_date: formData.transfer_date,
          return_date: formData.return_date || null,
          agreed_commission: formData.agreed_commission,
          commission_percentage: formData.commission_percentage,
          status: formData.status,
          notes: formData.notes || null,
        },
      });
      toast.success('تم تحديث التحويل بنجاح');
      setEditingTransfer(null);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث التحويل');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('تم حذف التحويل بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف التحويل');
    }
  };

  const openEditDialog = (transfer: CarTransfer) => {
    setEditingTransfer(transfer);
    setFormData({
      car_id: transfer.car_id,
      partner_dealership_id: transfer.partner_dealership_id,
      transfer_type: transfer.transfer_type,
      transfer_date: transfer.transfer_date,
      return_date: transfer.return_date || '',
      agreed_commission: transfer.agreed_commission,
      commission_percentage: transfer.commission_percentage,
      status: transfer.status,
      notes: transfer.notes || '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> قيد الانتظار</Badge>;
      case 'sold':
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" /> تم البيع</Badge>;
      case 'returned':
        return <Badge variant="secondary" className="gap-1"><RotateCcw className="w-3 h-3" /> مرتجع</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'outgoing') {
      return <Badge variant="destructive" className="gap-1"><ArrowUpRight className="w-3 h-3" /> صادر</Badge>;
    }
    return <Badge className="gap-1 bg-blue-500"><ArrowDownLeft className="w-3 h-3" /> وارد</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'yyyy/MM/dd');
  };

  const filteredTransfers = transfers?.filter(t => {
    const matchesSearch = 
      t.car?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.car?.chassis_number?.includes(searchQuery) ||
      t.partner_dealership?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesType = typeFilter === 'all' || t.transfer_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get available cars for transfer (only available ones)
  const availableCars = cars?.filter(c => c.status === 'available');

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">جاري التحميل...</div>;
  }

  const canEdit = permissions.admin || permissions.sales || permissions.purchases;

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <Label>السيارة *</Label>
        <Select value={formData.car_id} onValueChange={(value) => setFormData({ ...formData, car_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="اختر السيارة" />
          </SelectTrigger>
          <SelectContent>
            {(editingTransfer ? cars : availableCars)?.map((car) => (
              <SelectItem key={car.id} value={car.id}>
                {car.inventory_number} - {car.name} {car.model} ({car.chassis_number})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>المعرض الشريك *</Label>
        <Select value={formData.partner_dealership_id} onValueChange={(value) => setFormData({ ...formData, partner_dealership_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="اختر المعرض" />
          </SelectTrigger>
          <SelectContent>
            {dealerships?.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>نوع التحويل</Label>
        <Select value={formData.transfer_type} onValueChange={(value: 'outgoing' | 'incoming') => setFormData({ ...formData, transfer_type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outgoing">صادر (نحن نرسل)</SelectItem>
            <SelectItem value="incoming">وارد (نحن نستلم)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>تاريخ التحويل</Label>
          <Input
            type="date"
            value={formData.transfer_date}
            onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
          />
        </div>
        <div>
          <Label>تاريخ الإرجاع</Label>
          <Input
            type="date"
            value={formData.return_date}
            onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>العمولة المتفق عليها</Label>
          <Input
            type="number"
            value={formData.agreed_commission}
            onChange={(e) => setFormData({ ...formData, agreed_commission: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>نسبة العمولة (%)</Label>
          <Input
            type="number"
            value={formData.commission_percentage}
            onChange={(e) => setFormData({ ...formData, commission_percentage: Number(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <Label>الحالة</Label>
        <Select value={formData.status} onValueChange={(value: 'pending' | 'sold' | 'returned') => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="sold">تم البيع</SelectItem>
            <SelectItem value="returned">مرتجع</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>ملاحظات</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-xl">تحويلات السيارات</CardTitle>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-48"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="outgoing">صادر</SelectItem>
                <SelectItem value="incoming">وارد</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="sold">تم البيع</SelectItem>
                <SelectItem value="returned">مرتجع</SelectItem>
              </SelectContent>
            </Select>
            {canEdit && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    تحويل جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة تحويل جديد</DialogTitle>
                  </DialogHeader>
                  <FormFields />
                  <Button onClick={handleAdd} className="w-full mt-4">
                    إضافة
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">السيارة</TableHead>
                <TableHead className="text-right">رقم الشاسيه</TableHead>
                <TableHead className="text-right">المعرض</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">تاريخ التحويل</TableHead>
                <TableHead className="text-right">العمولة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                {canEdit && <TableHead className="text-right">الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers?.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">
                    {transfer.car?.inventory_number} - {transfer.car?.name} {transfer.car?.model}
                  </TableCell>
                  <TableCell>{transfer.car?.chassis_number}</TableCell>
                  <TableCell>{transfer.partner_dealership?.name}</TableCell>
                  <TableCell>{getTypeBadge(transfer.transfer_type)}</TableCell>
                  <TableCell>{formatDate(transfer.transfer_date)}</TableCell>
                  <TableCell>
                    {transfer.agreed_commission > 0 
                      ? formatCurrency(transfer.agreed_commission)
                      : transfer.commission_percentage > 0 
                        ? `${transfer.commission_percentage}%`
                        : '-'
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={editingTransfer?.id === transfer.id} onOpenChange={(open) => !open && setEditingTransfer(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(transfer)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>تعديل التحويل</DialogTitle>
                            </DialogHeader>
                            <FormFields />
                            <Button onClick={handleUpdate} className="w-full mt-4">
                              حفظ التعديلات
                            </Button>
                          </DialogContent>
                        </Dialog>
                        {permissions.admin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف التحويل نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(transfer.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!filteredTransfers || filteredTransfers.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تحويلات مسجلة
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
