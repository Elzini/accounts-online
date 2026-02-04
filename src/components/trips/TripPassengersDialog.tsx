import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import {
  useTripPassengers,
  useAddTripPassenger,
  useUpdateTripPassenger,
  useDeleteTripPassenger,
} from '@/hooks/useTrips';
import { Trip, TripPassenger } from '@/services/trips';

interface TripPassengersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
}

const TripPassengersDialog: React.FC<TripPassengersDialogProps> = ({
  open,
  onOpenChange,
  trip,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<TripPassenger | null>(null);
  const [passengerToDelete, setPassengerToDelete] = useState<TripPassenger | null>(null);
  const [formData, setFormData] = useState({
    passenger_name: '',
    passenger_phone: '',
    notes: '',
  });

  const { data: passengers = [], isLoading } = useTripPassengers(trip.id);
  const addPassenger = useAddTripPassenger();
  const updatePassenger = useUpdateTripPassenger();
  const deletePassenger = useDeleteTripPassenger();

  const resetForm = () => {
    setFormData({ passenger_name: '', passenger_phone: '', notes: '' });
    setShowAddForm(false);
    setEditingPassenger(null);
  };

  const handleAdd = async () => {
    if (!formData.passenger_name.trim()) return;

    await addPassenger.mutateAsync({
      tripId: trip.id,
      passenger: formData,
    });
    resetForm();
  };

  const handleEdit = (passenger: TripPassenger) => {
    setEditingPassenger(passenger);
    setFormData({
      passenger_name: passenger.passenger_name,
      passenger_phone: passenger.passenger_phone || '',
      notes: passenger.notes || '',
    });
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!editingPassenger || !formData.passenger_name.trim()) return;

    await updatePassenger.mutateAsync({
      passengerId: editingPassenger.id,
      updates: formData,
    });
    resetForm();
  };

  const handleDelete = async () => {
    if (passengerToDelete) {
      await deletePassenger.mutateAsync(passengerToDelete.id);
      setPassengerToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>المسافرين - رحلة إلى {trip.destination}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Main customer info */}
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="font-medium">العميل الرئيسي</div>
              <div className="text-sm text-muted-foreground">
                {trip.customer_name} - {trip.customer_phone}
              </div>
            </div>

            {/* Add/Edit form */}
            {(showAddForm || editingPassenger) && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="font-medium">
                  {editingPassenger ? 'تعديل بيانات المسافر' : 'إضافة مسافر جديد'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>الاسم *</Label>
                    <Input
                      value={formData.passenger_name}
                      onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
                      placeholder="اسم المسافر"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>رقم الجوال</Label>
                    <Input
                      value={formData.passenger_phone}
                      onChange={(e) => setFormData({ ...formData, passenger_phone: e.target.value })}
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>ملاحظات</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="ملاحظات"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={editingPassenger ? handleUpdate : handleAdd}
                    disabled={addPassenger.isPending || updatePassenger.isPending}
                  >
                    <Save className="h-4 w-4 ml-1" />
                    {editingPassenger ? 'تحديث' : 'إضافة'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 ml-1" />
                    إلغاء
                  </Button>
                </div>
              </div>
            )}

            {/* Passengers list */}
            {isLoading ? (
              <div className="text-center py-4">جاري التحميل...</div>
            ) : passengers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا يوجد مسافرين إضافيين
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">رقم الجوال</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                    <TableHead className="text-right w-24">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passengers.map((passenger) => (
                    <TableRow key={passenger.id}>
                      <TableCell>{passenger.passenger_name}</TableCell>
                      <TableCell>{passenger.passenger_phone || '-'}</TableCell>
                      <TableCell>{passenger.notes || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(passenger)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPassengerToDelete(passenger)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Add button */}
            {!showAddForm && !editingPassenger && (
              <Button variant="outline" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة مسافر
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!passengerToDelete} onOpenChange={() => setPassengerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المسافر</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{passengerToDelete?.passenger_name}"؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TripPassengersDialog;
