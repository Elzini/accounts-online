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
import { useCars, useUpdateCar, useAddCar } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ActivePage } from '@/types';
import { CarTransfer } from '@/services/transfers';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

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
  const updateCarMutation = useUpdateCar();
  const addCarMutation = useAddCar();
  const queryClient = useQueryClient();
  const { permissions } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isIncomingDialogOpen, setIsIncomingDialogOpen] = useState(false);
  const [isEditIncomingDialogOpen, setIsEditIncomingDialogOpen] = useState(false);
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

  // For incoming car form - new car data
  const [incomingCarData, setIncomingCarData] = useState({
    name: '',
    model: '',
    color: '',
    chassis_number: '',
    purchase_price: 0,
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    partner_dealership_id: '',
    transfer_date: format(new Date(), 'yyyy-MM-dd'),
    agreed_commission: 0,
    commission_percentage: 0,
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

  const resetIncomingForm = () => {
    setIncomingCarData({
      name: '',
      model: '',
      color: '',
      chassis_number: '',
      purchase_price: 0,
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      partner_dealership_id: '',
      transfer_date: format(new Date(), 'yyyy-MM-dd'),
      agreed_commission: 0,
      commission_percentage: 0,
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

      // Update car status to 'transferred' when adding a new transfer
      if (formData.status === 'pending') {
        await updateCarMutation.mutateAsync({
          id: formData.car_id,
          car: { status: 'transferred' },
        });
        queryClient.invalidateQueries({ queryKey: ['cars'] });
      }

      toast.success('تم إضافة التحويل بنجاح');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة التحويل');
    }
  };

  // Handle adding incoming car - creates car first then transfer
  const handleAddIncomingCar = async () => {
    if (!incomingCarData.name || !incomingCarData.chassis_number || !incomingCarData.partner_dealership_id) {
      toast.error('يرجى إدخال اسم السيارة ورقم الشاسيه والمعرض');
      return;
    }

    try {
      // First, create the car in inventory with status 'transferred'
      const newCar = await addCarMutation.mutateAsync({
        name: incomingCarData.name,
        model: incomingCarData.model || null,
        color: incomingCarData.color || null,
        chassis_number: incomingCarData.chassis_number,
        purchase_price: incomingCarData.purchase_price,
        purchase_date: incomingCarData.purchase_date,
        status: 'transferred', // Will be changed to 'available' when returned or if needed
      });

      // Then create the transfer record
      await addMutation.mutateAsync({
        car_id: newCar.id,
        partner_dealership_id: incomingCarData.partner_dealership_id,
        transfer_type: 'incoming',
        transfer_date: incomingCarData.transfer_date,
        agreed_commission: incomingCarData.agreed_commission,
        commission_percentage: incomingCarData.commission_percentage,
        status: 'pending',
        notes: incomingCarData.notes || null,
      });

      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      toast.success('تم إضافة السيارة الواردة بنجاح');
      setIsIncomingDialogOpen(false);
      resetIncomingForm();
    } catch (error) {
      console.error('Error adding incoming car:', error);
      toast.error('حدث خطأ أثناء إضافة السيارة الواردة');
    }
  };

  const handleUpdate = async () => {
    if (!editingTransfer) return;

    try {
      const previousStatus = editingTransfer.status;
      const newStatus = formData.status;

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

      // If status changed to 'returned', update car status to 'available'
      if (previousStatus !== 'returned' && newStatus === 'returned') {
        await updateCarMutation.mutateAsync({
          id: formData.car_id,
          car: { status: 'available' },
        });
        queryClient.invalidateQueries({ queryKey: ['cars'] });
      }

      toast.success('تم تحديث التحويل بنجاح');
      setEditingTransfer(null);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث التحويل');
    }
  };

  // Handle updating incoming car - updates both car and transfer
  const handleUpdateIncomingCar = async () => {
    if (!editingTransfer) return;

    try {
      // Update the car details
      await updateCarMutation.mutateAsync({
        id: editingTransfer.car_id,
        car: {
          name: incomingCarData.name,
          model: incomingCarData.model || null,
          color: incomingCarData.color || null,
          chassis_number: incomingCarData.chassis_number,
          purchase_price: incomingCarData.purchase_price,
          purchase_date: incomingCarData.purchase_date,
        },
      });

      // Update the transfer details
      await updateMutation.mutateAsync({
        id: editingTransfer.id,
        data: {
          partner_dealership_id: incomingCarData.partner_dealership_id,
          transfer_date: incomingCarData.transfer_date,
          agreed_commission: incomingCarData.agreed_commission,
          commission_percentage: incomingCarData.commission_percentage,
          notes: incomingCarData.notes || null,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['carTransfers'] });
      
      toast.success('تم تحديث بيانات السيارة الواردة بنجاح');
      setIsEditIncomingDialogOpen(false);
      setEditingTransfer(null);
      resetIncomingForm();
    } catch (error) {
      console.error('Error updating incoming car:', error);
      toast.error('حدث خطأ أثناء تحديث بيانات السيارة');
    }
  };

  const openEditIncomingDialog = (transfer: CarTransfer) => {
    setEditingTransfer(transfer);
    setIncomingCarData({
      name: transfer.car?.name || '',
      model: transfer.car?.model || '',
      color: transfer.car?.color || '',
      chassis_number: transfer.car?.chassis_number || '',
      purchase_price: transfer.car?.purchase_price || 0,
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      partner_dealership_id: transfer.partner_dealership_id,
      transfer_date: transfer.transfer_date,
      agreed_commission: transfer.agreed_commission,
      commission_percentage: transfer.commission_percentage,
      notes: transfer.notes || '',
    });
    setIsEditIncomingDialogOpen(true);
  };

  const handleQuickReturn = async (transfer: CarTransfer) => {
    try {
      await updateMutation.mutateAsync({
        id: transfer.id,
        data: {
          status: 'returned',
          return_date: format(new Date(), 'yyyy-MM-dd'),
        },
      });

      // Update car status to 'available'
      await updateCarMutation.mutateAsync({
        id: transfer.car_id,
        car: { status: 'available' },
      });
      queryClient.invalidateQueries({ queryKey: ['cars'] });

      toast.success('تم إرجاع السيارة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء إرجاع السيارة');
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

  const IncomingCarFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>اسم السيارة *</Label>
          <Input
            value={incomingCarData.name}
            onChange={(e) => setIncomingCarData({ ...incomingCarData, name: e.target.value })}
            placeholder="مثال: تويوتا كامري"
          />
        </div>
        <div>
          <Label>الموديل</Label>
          <Input
            value={incomingCarData.model}
            onChange={(e) => setIncomingCarData({ ...incomingCarData, model: e.target.value })}
            placeholder="مثال: 2023"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>رقم الشاسيه *</Label>
          <Input
            value={incomingCarData.chassis_number}
            onChange={(e) => setIncomingCarData({ ...incomingCarData, chassis_number: e.target.value })}
            placeholder="رقم الشاسيه"
          />
        </div>
        <div>
          <Label>اللون</Label>
          <Input
            value={incomingCarData.color}
            onChange={(e) => setIncomingCarData({ ...incomingCarData, color: e.target.value })}
            placeholder="مثال: أبيض"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>سعر الشراء</Label>
          <Input
            type="number"
            value={incomingCarData.purchase_price}
            onChange={(e) => setIncomingCarData({ ...incomingCarData, purchase_price: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>تاريخ الشراء</Label>
          <Input
            type="date"
            value={incomingCarData.purchase_date}
            onChange={(e) => setIncomingCarData({ ...incomingCarData, purchase_date: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>المعرض الشريك *</Label>
        <Select value={incomingCarData.partner_dealership_id} onValueChange={(value) => setIncomingCarData({ ...incomingCarData, partner_dealership_id: value })}>
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>تاريخ التحويل</Label>
          <Input
            type="date"
            value={incomingCarData.transfer_date}
            onChange={(e) => setIncomingCarData({ ...incomingCarData, transfer_date: e.target.value })}
          />
        </div>
        <div>
          <Label>العمولة المتفق عليها</Label>
          <Input
            type="number"
            value={incomingCarData.agreed_commission}
            onChange={(e) => setIncomingCarData({ ...incomingCarData, agreed_commission: Number(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <Label>نسبة العمولة (%)</Label>
        <Input
          type="number"
          value={incomingCarData.commission_percentage}
          onChange={(e) => setIncomingCarData({ ...incomingCarData, commission_percentage: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label>ملاحظات</Label>
        <Textarea
          value={incomingCarData.notes}
          onChange={(e) => setIncomingCarData({ ...incomingCarData, notes: e.target.value })}
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
              <>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <ArrowUpRight className="w-4 h-4" />
                      تحويل صادر
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>إضافة تحويل صادر</DialogTitle>
                    </DialogHeader>
                    <FormFields />
                    <Button onClick={handleAdd} className="w-full mt-4">
                      إضافة
                    </Button>
                  </DialogContent>
                </Dialog>
                <Dialog open={isIncomingDialogOpen} onOpenChange={setIsIncomingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <ArrowDownLeft className="w-4 h-4" />
                      سيارة واردة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>إضافة سيارة واردة من معرض شريك</DialogTitle>
                    </DialogHeader>
                    <IncomingCarFormFields />
                    <Button onClick={handleAddIncomingCar} className="w-full mt-4">
                      إضافة السيارة
                    </Button>
                  </DialogContent>
                </Dialog>
              </>
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
                        {transfer.status === 'pending' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="text-orange-600 hover:text-orange-700" title="إرجاع السيارة">
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>إرجاع السيارة</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل تريد إرجاع السيارة "{transfer.car?.name} {transfer.car?.model}" من المعرض "{transfer.partner_dealership?.name}"؟
                                  <br />
                                  سيتم تحديث حالة السيارة إلى "متاحة" في المخزون.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleQuickReturn(transfer)}>
                                  تأكيد الإرجاع
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {/* Edit button - different dialog for incoming vs outgoing */}
                        {transfer.transfer_type === 'incoming' ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditIncomingDialog(transfer)}
                            title="تعديل بيانات السيارة"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Dialog open={editingTransfer?.id === transfer.id && !isEditIncomingDialogOpen} onOpenChange={(open) => !open && setEditingTransfer(null)}>
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
                        )}
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

        {/* Edit Incoming Car Dialog */}
        <Dialog open={isEditIncomingDialogOpen} onOpenChange={(open) => {
          setIsEditIncomingDialogOpen(open);
          if (!open) {
            setEditingTransfer(null);
            resetIncomingForm();
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تعديل بيانات السيارة الواردة</DialogTitle>
            </DialogHeader>
            <IncomingCarFormFields />
            <Button onClick={handleUpdateIncomingCar} className="w-full mt-4">
              حفظ التعديلات
            </Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
