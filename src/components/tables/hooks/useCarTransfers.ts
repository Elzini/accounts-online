/**
 * Car Transfers - Logic Hook
 * Extracted from CarTransfersTable.tsx (758 lines)
 */
import { useState } from 'react';
import { useCarTransfers, useAddCarTransfer, useUpdateCarTransfer, useDeleteCarTransfer, usePartnerDealerships } from '@/hooks/useTransfers';
import { useCars, useUpdateCar, useAddCar, useDeleteCar } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CarTransfer } from '@/services/transfers';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

const emptyForm = {
  car_id: '', partner_dealership_id: '', transfer_type: 'outgoing' as 'outgoing' | 'incoming',
  transfer_date: format(new Date(), 'yyyy-MM-dd'), return_date: '',
  agreed_commission: 0, commission_percentage: 0, status: 'pending' as 'pending' | 'sold' | 'returned', notes: '',
};

const emptyIncoming = {
  name: '', model: '', color: '', chassis_number: '', purchase_price: 0,
  purchase_date: format(new Date(), 'yyyy-MM-dd'), partner_dealership_id: '',
  transfer_date: format(new Date(), 'yyyy-MM-dd'), agreed_commission: 0,
  commission_percentage: 0, notes: '',
};

export function useCarTransfersLogic() {
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formData, setFormData] = useState({ ...emptyForm });
  const [incomingCarData, setIncomingCarData] = useState({ ...emptyIncoming });

  const resetForm = () => { setFormData({ ...emptyForm }); };
  const resetIncomingForm = () => { setIncomingCarData({ ...emptyIncoming }); };

  const handleAdd = async () => {
    if (!formData.car_id || !formData.partner_dealership_id) { toast.error(t.select_car_dealership); return; }
    try {
      await addMutation.mutateAsync({ car_id: formData.car_id, partner_dealership_id: formData.partner_dealership_id, transfer_type: formData.transfer_type, transfer_date: formData.transfer_date, return_date: formData.return_date || null, agreed_commission: formData.agreed_commission, commission_percentage: formData.commission_percentage, status: formData.status, notes: formData.notes || null });
      if (formData.status === 'pending') { await updateCarMutation.mutateAsync({ id: formData.car_id, car: { status: 'transferred' } }); queryClient.invalidateQueries({ queryKey: ['cars'] }); }
      toast.success(t.transfer_added); setIsAddDialogOpen(false); resetForm();
    } catch { toast.error(t.transfer_error); }
  };

  const handleAddIncomingCar = async () => {
    if (!incomingCarData.name || !incomingCarData.chassis_number || !incomingCarData.partner_dealership_id) { toast.error(t.enter_car_name_chassis); return; }
    try {
      const newCar = await addCarMutation.mutateAsync({ name: incomingCarData.name, model: incomingCarData.model || null, color: incomingCarData.color || null, chassis_number: incomingCarData.chassis_number, purchase_price: incomingCarData.purchase_price, purchase_date: incomingCarData.purchase_date, status: 'transferred' });
      await addMutation.mutateAsync({ car_id: newCar.id, partner_dealership_id: incomingCarData.partner_dealership_id, transfer_type: 'incoming', transfer_date: incomingCarData.transfer_date, agreed_commission: incomingCarData.agreed_commission, commission_percentage: incomingCarData.commission_percentage, status: 'pending', notes: incomingCarData.notes || null });
      queryClient.invalidateQueries({ queryKey: ['cars'] }); queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success(t.transfer_added); setIsIncomingDialogOpen(false); resetIncomingForm();
    } catch (error: any) { toast.error(error?.message || t.transfer_error); }
  };

  const handleUpdate = async () => {
    if (!editingTransfer) return;
    try {
      const prev = editingTransfer.status; const next = formData.status;
      if (prev !== 'returned' && next === 'returned' && formData.transfer_type === 'incoming') {
        await deleteMutation.mutateAsync(editingTransfer.id); await deleteCarMutation.mutateAsync(formData.car_id);
        queryClient.invalidateQueries({ queryKey: ['cars'] }); queryClient.invalidateQueries({ queryKey: ['stats'] });
        toast.success(t.incoming_car_returned); setEditingTransfer(null); resetForm(); return;
      }
      await updateMutation.mutateAsync({ id: editingTransfer.id, data: { car_id: formData.car_id, partner_dealership_id: formData.partner_dealership_id, transfer_type: formData.transfer_type, transfer_date: formData.transfer_date, return_date: formData.return_date || null, agreed_commission: formData.agreed_commission, commission_percentage: formData.commission_percentage, status: formData.status, notes: formData.notes || null } });
      if (prev !== 'returned' && next === 'returned') { await updateCarMutation.mutateAsync({ id: formData.car_id, car: { status: 'available' } }); queryClient.invalidateQueries({ queryKey: ['cars'] }); }
      toast.success(t.transfer_updated); setEditingTransfer(null); resetForm();
    } catch { toast.error(t.transfer_error); }
  };

  const handleUpdateIncomingCar = async () => {
    if (!editingTransfer) return;
    try {
      await updateCarMutation.mutateAsync({ id: editingTransfer.car_id, car: { name: incomingCarData.name, model: incomingCarData.model || null, color: incomingCarData.color || null, chassis_number: incomingCarData.chassis_number, purchase_price: incomingCarData.purchase_price, purchase_date: incomingCarData.purchase_date } });
      await updateMutation.mutateAsync({ id: editingTransfer.id, data: { partner_dealership_id: incomingCarData.partner_dealership_id, transfer_date: incomingCarData.transfer_date, agreed_commission: incomingCarData.agreed_commission, commission_percentage: incomingCarData.commission_percentage, notes: incomingCarData.notes || null } });
      queryClient.invalidateQueries({ queryKey: ['cars'] }); queryClient.invalidateQueries({ queryKey: ['carTransfers'] });
      toast.success(t.transfer_updated); setIsEditIncomingDialogOpen(false); setEditingTransfer(null); resetIncomingForm();
    } catch { toast.error(t.transfer_error); }
  };

  const openEditIncomingDialog = (transfer: CarTransfer) => {
    setEditingTransfer(transfer);
    setIncomingCarData({ name: transfer.car?.name || '', model: transfer.car?.model || '', color: transfer.car?.color || '', chassis_number: transfer.car?.chassis_number || '', purchase_price: transfer.car?.purchase_price || 0, purchase_date: format(new Date(), 'yyyy-MM-dd'), partner_dealership_id: transfer.partner_dealership_id, transfer_date: transfer.transfer_date, agreed_commission: transfer.agreed_commission, commission_percentage: transfer.commission_percentage, notes: transfer.notes || '' });
    setIsEditIncomingDialogOpen(true);
  };

  const handleQuickReturn = async (transfer: CarTransfer) => {
    try {
      if (transfer.transfer_type === 'incoming') {
        await deleteMutation.mutateAsync(transfer.id); await deleteCarMutation.mutateAsync(transfer.car_id);
        queryClient.invalidateQueries({ queryKey: ['cars'] }); queryClient.invalidateQueries({ queryKey: ['stats'] });
        toast.success(t.incoming_car_returned);
      } else {
        await updateMutation.mutateAsync({ id: transfer.id, data: { status: 'returned', return_date: format(new Date(), 'yyyy-MM-dd') } });
        await updateCarMutation.mutateAsync({ id: transfer.car_id, car: { status: 'available' } });
        queryClient.invalidateQueries({ queryKey: ['cars'] }); toast.success(t.car_returned);
      }
    } catch { toast.error(t.transfer_error); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); toast.success(t.transfer_deleted); } catch { toast.error(t.transfer_error); }
  };

  const openEditDialog = (transfer: CarTransfer) => {
    setEditingTransfer(transfer);
    setFormData({ car_id: transfer.car_id, partner_dealership_id: transfer.partner_dealership_id, transfer_type: transfer.transfer_type, transfer_date: transfer.transfer_date, return_date: transfer.return_date || '', agreed_commission: transfer.agreed_commission, commission_percentage: transfer.commission_percentage, status: transfer.status, notes: transfer.notes || '' });
  };

  const filteredTransfers = transfers?.filter(tf => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = tf.car?.name?.toLowerCase().includes(q) || tf.car?.chassis_number?.includes(searchQuery) || tf.partner_dealership?.name?.toLowerCase().includes(q);
    return matchesSearch && (statusFilter === 'all' || tf.status === statusFilter) && (typeFilter === 'all' || tf.transfer_type === typeFilter);
  });

  const availableCars = cars?.filter(c => c.status === 'available');
  const canEdit = permissions.admin || permissions.sales || permissions.purchases;

  return {
    t, isLoading, transfers, dealerships, cars, availableCars, filteredTransfers, canEdit, permissions,
    isAddDialogOpen, setIsAddDialogOpen, isIncomingDialogOpen, setIsIncomingDialogOpen,
    isEditIncomingDialogOpen, setIsEditIncomingDialogOpen, editingTransfer, setEditingTransfer,
    searchQuery, setSearchQuery, statusFilter, setStatusFilter, typeFilter, setTypeFilter,
    formData, setFormData, incomingCarData, setIncomingCarData,
    resetForm, resetIncomingForm,
    handleAdd, handleAddIncomingCar, handleUpdate, handleUpdateIncomingCar,
    openEditIncomingDialog, handleQuickReturn, handleDelete, openEditDialog,
  };
}
