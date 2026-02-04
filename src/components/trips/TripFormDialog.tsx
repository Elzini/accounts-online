import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTrip, useUpdateTrip } from '@/hooks/useTrips';
import { Trip } from '@/services/trips';
import { Plus, Trash2 } from 'lucide-react';

interface TripFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip | null;
}

interface PassengerInput {
  passenger_name: string;
  passenger_phone: string;
  notes: string;
}

const TripFormDialog: React.FC<TripFormDialogProps> = ({
  open,
  onOpenChange,
  trip,
}) => {
  const [formData, setFormData] = useState<{
    customer_name: string;
    customer_phone: string;
    destination: string;
    departure_point: string;
    trip_date: string;
    trip_time: string;
    price: number;
    reminder_hours_before: number;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes: string;
  }>({
    customer_name: '',
    customer_phone: '',
    destination: '',
    departure_point: '',
    trip_date: '',
    trip_time: '',
    price: 0,
    reminder_hours_before: 24,
    status: 'scheduled',
    notes: '',
  });

  const [passengers, setPassengers] = useState<PassengerInput[]>([]);

  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();

  useEffect(() => {
    if (trip) {
      setFormData({
        customer_name: trip.customer_name,
        customer_phone: trip.customer_phone,
        destination: trip.destination,
        departure_point: trip.departure_point,
        trip_date: trip.trip_date,
        trip_time: trip.trip_time,
        price: trip.price || 0,
        reminder_hours_before: trip.reminder_hours_before || 24,
        status: trip.status as 'scheduled' | 'completed' | 'cancelled',
        notes: trip.notes || '',
      });
      setPassengers([]);
    } else {
      setFormData({
        customer_name: '',
        customer_phone: '',
        destination: '',
        departure_point: '',
        trip_date: '',
        trip_time: '',
        price: 0,
        reminder_hours_before: 24,
        status: 'scheduled',
        notes: '',
      });
      setPassengers([]);
    }
  }, [trip, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (trip) {
      await updateTrip.mutateAsync({
        tripId: trip.id,
        updates: formData,
      });
    } else {
      await createTrip.mutateAsync({
        ...formData,
        passengers: passengers.filter(p => p.passenger_name.trim()),
      });
    }

    onOpenChange(false);
  };

  const addPassenger = () => {
    setPassengers([...passengers, { passenger_name: '', passenger_phone: '', notes: '' }]);
  };

  const removePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const updatePassenger = (index: number, field: keyof PassengerInput, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const isSubmitting = createTrip.isPending || updateTrip.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trip ? 'تعديل الرحلة' : 'إضافة رحلة جديدة'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">اسم العميل *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone">رقم الجوال *</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="05xxxxxxxx"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departure_point">نقطة الانطلاق *</Label>
              <Input
                id="departure_point"
                value={formData.departure_point}
                onChange={(e) => setFormData({ ...formData, departure_point: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">الوجهة *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trip_date">تاريخ الرحلة *</Label>
              <Input
                id="trip_date"
                type="date"
                value={formData.trip_date}
                onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trip_time">وقت الرحلة *</Label>
              <Input
                id="trip_time"
                type="time"
                value={formData.trip_time}
                onChange={(e) => setFormData({ ...formData, trip_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">السعر (ريال)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_hours_before">إرسال التذكير قبل (ساعة)</Label>
              <Select
                value={formData.reminder_hours_before.toString()}
                onValueChange={(value) => setFormData({ ...formData, reminder_hours_before: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">ساعة واحدة</SelectItem>
                  <SelectItem value="2">ساعتين</SelectItem>
                  <SelectItem value="6">6 ساعات</SelectItem>
                  <SelectItem value="12">12 ساعة</SelectItem>
                  <SelectItem value="24">24 ساعة (يوم)</SelectItem>
                  <SelectItem value="48">48 ساعة (يومين)</SelectItem>
                  <SelectItem value="72">72 ساعة (3 أيام)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {trip && (
              <div className="space-y-2">
                <Label htmlFor="status">حالة الرحلة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'scheduled' | 'completed' | 'cancelled') => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">مجدولة</SelectItem>
                    <SelectItem value="completed">مكتملة</SelectItem>
                    <SelectItem value="cancelled">ملغية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Passengers Section - Only for new trips */}
          {!trip && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">المسافرين الإضافيين</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPassenger}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة مسافر
                </Button>
              </div>

              {passengers.map((passenger, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      placeholder="اسم المسافر"
                      value={passenger.passenger_name}
                      onChange={(e) => updatePassenger(index, 'passenger_name', e.target.value)}
                    />
                    <Input
                      placeholder="رقم الجوال (اختياري)"
                      value={passenger.passenger_phone}
                      onChange={(e) => updatePassenger(index, 'passenger_phone', e.target.value)}
                    />
                    <Input
                      placeholder="ملاحظات"
                      value={passenger.notes}
                      onChange={(e) => updatePassenger(index, 'notes', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePassenger(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : trip ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TripFormDialog;
