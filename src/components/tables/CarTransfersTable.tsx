import { useState } from 'react';
import { Plus, Edit, Trash2, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCarTransfers, useAddCarTransfer, useUpdateCarTransfer, useDeleteCarTransfer, usePartnerDealerships } from '@/hooks/useTransfers';
import { useCars, useUpdateCar, useAddCar, useDeleteCar } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ActivePage } from '@/types';
import { CarTransfer } from '@/services/transfers';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

interface CarTransfersTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function CarTransfersTable({ setActivePage }: CarTransfersTableProps) {
  const { t } = useLanguage();
  const { data: transfers, isLoading } = useCarTransfers();
  const { data: dealerships } = usePartnerDealerships();
  const { data: cars } = useCars();
  const addMutation = useAddCarTransfer();
  const updateMutation = useUpdateCarTransfer();
  const deleteMutation = useDeleteCarTransfer();
  const updateCarMutation = useUpdateCar();
  const addCarMutation = useAddCar();
  const deleteCarMutation = useDeleteCar();
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
      toast.error(t.select_car_dealership);
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

      if (formData.status === 'pending') {
        await updateCarMutation.mutateAsync({
          id: formData.car_id,
          car: { status: 'transferred' },
        });
        queryClient.invalidateQueries({ queryKey: ['cars'] });
      }

      toast.success(t.transfer_added);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t.transfer_error);
    }
  };

  const handleAddIncomingCar = async () => {
    if (!incomingCarData.name || !incomingCarData.chassis_number || !incomingCarData.partner_dealership_id) {
      toast.error(t.enter_car_name_chassis);
      return;
    }

    try {
      const newCar = await addCarMutation.mutateAsync({
        name: incomingCarData.name,
        model: incomingCarData.model || null,
        color: incomingCarData.color || null,
        chassis_number: incomingCarData.chassis_number,
        purchase_price: incomingCarData.purchase_price,
        purchase_date: incomingCarData.purchase_date,
        status: 'transferred',
      });

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
      
      toast.success(t.transfer_added);
      setIsIncomingDialogOpen(false);
      resetIncomingForm();
    } catch (error: any) {
      console.error('Error adding incoming car:', error);
      const errorMessage = error?.message || error?.error_description || t.transfer_error;
      toast.error(errorMessage);
    }
  };

  const handleUpdate = async () => {
    if (!editingTransfer) return;

    try {
      const previousStatus = editingTransfer.status;
      const newStatus = formData.status;

      if (previousStatus !== 'returned' && newStatus === 'returned' && formData.transfer_type === 'incoming') {
        await deleteMutation.mutateAsync(editingTransfer.id);
        await deleteCarMutation.mutateAsync(formData.car_id);
        queryClient.invalidateQueries({ queryKey: ['cars'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        toast.success(t.incoming_car_returned);
        setEditingTransfer(null);
        resetForm();
        return;
      }

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

      if (previousStatus !== 'returned' && newStatus === 'returned') {
        await updateCarMutation.mutateAsync({
          id: formData.car_id,
          car: { status: 'available' },
        });
        queryClient.invalidateQueries({ queryKey: ['cars'] });
      }

      toast.success(t.transfer_updated);
      setEditingTransfer(null);
      resetForm();
    } catch (error) {
      toast.error(t.transfer_error);
    }
  };

  const handleUpdateIncomingCar = async () => {
    if (!editingTransfer) return;

    try {
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
      
      toast.success(t.transfer_updated);
      setIsEditIncomingDialogOpen(false);
      setEditingTransfer(null);
      resetIncomingForm();
    } catch (error) {
      console.error('Error updating incoming car:', error);
      toast.error(t.transfer_error);
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
      if (transfer.transfer_type === 'incoming') {
        await deleteMutation.mutateAsync(transfer.id);
        await deleteCarMutation.mutateAsync(transfer.car_id);
        queryClient.invalidateQueries({ queryKey: ['cars'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        toast.success(t.incoming_car_returned);
      } else {
        await updateMutation.mutateAsync({
          id: transfer.id,
          data: {
            status: 'returned',
            return_date: format(new Date(), 'yyyy-MM-dd'),
          },
        });
        await updateCarMutation.mutateAsync({
          id: transfer.car_id,
          car: { status: 'available' },
        });
        queryClient.invalidateQueries({ queryKey: ['cars'] });
        toast.success(t.car_returned);
      }
    } catch (error) {
      toast.error(t.transfer_error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t.transfer_deleted);
    } catch (error) {
      toast.error(t.transfer_error);
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
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> {t.pending_status}</Badge>;
      case 'sold':
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" /> {t.sold_status}</Badge>;
      case 'returned':
        return <Badge variant="secondary" className="gap-1"><RotateCcw className="w-3 h-3" /> {t.returned_status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'outgoing') {
      return <Badge variant="destructive" className="gap-1"><ArrowUpRight className="w-3 h-3" /> {t.outgoing_badge}</Badge>;
    }
    return <Badge className="gap-1 bg-blue-500"><ArrowDownLeft className="w-3 h-3" /> {t.incoming_badge}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'yyyy/MM/dd');
  };

  const filteredTransfers = transfers?.filter(tf => {
    const matchesSearch = 
      tf.car?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tf.car?.chassis_number?.includes(searchQuery) ||
      tf.partner_dealership?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tf.status === statusFilter;
    const matchesType = typeFilter === 'all' || tf.transfer_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const availableCars = cars?.filter(c => c.status === 'available');

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">{t.loading}</div>;
  }

  const canEdit = permissions.admin || permissions.sales || permissions.purchases;

  const formFieldsJSX = (
    <div className="space-y-4">
      <div>
        <Label>{t.select_car} *</Label>
        <Select value={formData.car_id} onValueChange={(value) => setFormData({ ...formData, car_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder={t.select_car} />
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
        <Label>{t.partner_dealership} *</Label>
        <Select value={formData.partner_dealership_id} onValueChange={(value) => setFormData({ ...formData, partner_dealership_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder={t.select_dealership} />
          </SelectTrigger>
          <SelectContent>
            {dealerships?.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{t.transfer_type}</Label>
        <Select value={formData.transfer_type} onValueChange={(value: 'outgoing' | 'incoming') => setFormData({ ...formData, transfer_type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outgoing">{t.outgoing_we_send}</SelectItem>
            <SelectItem value="incoming">{t.incoming_we_receive}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.transfer_date}</Label>
          <Input type="date" value={formData.transfer_date} onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })} />
        </div>
        <div>
          <Label>{t.return_date}</Label>
          <Input type="date" value={formData.return_date} onChange={(e) => setFormData({ ...formData, return_date: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.agreed_commission}</Label>
          <Input type="number" value={formData.agreed_commission} onChange={(e) => setFormData({ ...formData, agreed_commission: Number(e.target.value) })} />
        </div>
        <div>
          <Label>{t.commission_percent} (%)</Label>
          <Input type="number" value={formData.commission_percentage} onChange={(e) => setFormData({ ...formData, commission_percentage: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <Label>{t.status}</Label>
        <Select value={formData.status} onValueChange={(value: 'pending' | 'sold' | 'returned') => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">{t.pending_status}</SelectItem>
            <SelectItem value="sold">{t.sold_status}</SelectItem>
            <SelectItem value="returned">{t.returned_status}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{t.notes}</Label>
        <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
      </div>
    </div>
  );

  const incomingCarFormFieldsJSX = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.car_name_label} *</Label>
          <Input value={incomingCarData.name} onChange={(e) => setIncomingCarData({ ...incomingCarData, name: e.target.value })} placeholder={t.form_example_car} />
        </div>
        <div>
          <Label>{t.form_model}</Label>
          <Input value={incomingCarData.model} onChange={(e) => setIncomingCarData({ ...incomingCarData, model: e.target.value })} placeholder={t.form_example_year} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.th_chassis_number} *</Label>
          <Input value={incomingCarData.chassis_number} onChange={(e) => setIncomingCarData({ ...incomingCarData, chassis_number: e.target.value })} placeholder={t.form_enter_chassis} />
        </div>
        <div>
          <Label>{t.form_color}</Label>
          <Input value={incomingCarData.color} onChange={(e) => setIncomingCarData({ ...incomingCarData, color: e.target.value })} placeholder={t.form_enter_color} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.form_purchase_price}</Label>
          <Input type="number" value={incomingCarData.purchase_price} onChange={(e) => setIncomingCarData({ ...incomingCarData, purchase_price: Number(e.target.value) })} />
        </div>
        <div>
          <Label>{t.form_purchase_date}</Label>
          <Input type="date" value={incomingCarData.purchase_date} onChange={(e) => setIncomingCarData({ ...incomingCarData, purchase_date: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>{t.partner_dealership} *</Label>
        <Select value={incomingCarData.partner_dealership_id} onValueChange={(value) => setIncomingCarData({ ...incomingCarData, partner_dealership_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder={t.select_dealership} />
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
          <Label>{t.transfer_date}</Label>
          <Input type="date" value={incomingCarData.transfer_date} onChange={(e) => setIncomingCarData({ ...incomingCarData, transfer_date: e.target.value })} />
        </div>
        <div>
          <Label>{t.agreed_commission}</Label>
          <Input type="number" value={incomingCarData.agreed_commission} onChange={(e) => setIncomingCarData({ ...incomingCarData, agreed_commission: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <Label>{t.commission_percent} (%)</Label>
        <Input type="number" value={incomingCarData.commission_percentage} onChange={(e) => setIncomingCarData({ ...incomingCarData, commission_percentage: Number(e.target.value) })} />
      </div>
      <div>
        <Label>{t.notes}</Label>
        <Textarea value={incomingCarData.notes} onChange={(e) => setIncomingCarData({ ...incomingCarData, notes: e.target.value })} />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-xl">{t.car_transfers_title}</CardTitle>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Input
              placeholder={t.search + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-48"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder={t.transfer_type} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="outgoing">{t.outgoing_badge}</SelectItem>
                <SelectItem value="incoming">{t.incoming_badge}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="pending">{t.pending_status}</SelectItem>
                <SelectItem value="sold">{t.sold_status}</SelectItem>
                <SelectItem value="returned">{t.returned_status}</SelectItem>
              </SelectContent>
            </Select>
            {canEdit && (
              <>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <ArrowUpRight className="w-4 h-4" />
                      {t.outgoing_transfer}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t.add_transfer}</DialogTitle>
                    </DialogHeader>
                    {formFieldsJSX}
                    <Button onClick={handleAdd} className="w-full mt-4">
                      {t.add}
                    </Button>
                  </DialogContent>
                </Dialog>
                <Dialog open={isIncomingDialogOpen} onOpenChange={setIsIncomingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <ArrowDownLeft className="w-4 h-4" />
                      {t.incoming_car}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t.incoming_car}</DialogTitle>
                    </DialogHeader>
                    {incomingCarFormFieldsJSX}
                    <Button onClick={handleAddIncomingCar} className="w-full mt-4">
                      {t.add}
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
                <TableHead className="text-right">{t.th_car}</TableHead>
                <TableHead className="text-right">{t.th_chassis_number}</TableHead>
                <TableHead className="text-right">{t.partner_dealership}</TableHead>
                <TableHead className="text-right">{t.transfer_type}</TableHead>
                <TableHead className="text-right">{t.transfer_date}</TableHead>
                <TableHead className="text-right">{t.agreed_commission}</TableHead>
                <TableHead className="text-right">{t.status}</TableHead>
                {canEdit && <TableHead className="text-right">{t.actions}</TableHead>}
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
                              <Button variant="outline" size="icon" className="text-orange-600 hover:text-orange-700" title={t.return_label}>
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.return_label}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {transfer.car?.name} {transfer.car?.model} - {transfer.partner_dealership?.name}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleQuickReturn(transfer)}>
                                  {t.confirm}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {transfer.transfer_type === 'incoming' ? (
                          <Button variant="ghost" size="icon" onClick={() => openEditIncomingDialog(transfer)} title={t.edit}>
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
                                <DialogTitle>{t.edit_transfer}</DialogTitle>
                              </DialogHeader>
                              {formFieldsJSX}
                              <Button onClick={handleUpdate} className="w-full mt-4">
                                {t.save_changes}
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
                                <AlertDialogTitle>{t.confirm_delete}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.confirm_delete_desc}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(transfer.id)}>
                                  {t.delete}
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
              {t.no_data}
            </div>
          )}
        </div>

        <Dialog open={isEditIncomingDialogOpen} onOpenChange={(open) => {
          setIsEditIncomingDialogOpen(open);
          if (!open) {
            setEditingTransfer(null);
            resetIncomingForm();
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.edit_transfer}</DialogTitle>
            </DialogHeader>
            {incomingCarFormFieldsJSX}
            <Button onClick={handleUpdateIncomingCar} className="w-full mt-4">
              {t.save_changes}
            </Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
