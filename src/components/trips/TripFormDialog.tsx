import React, { useEffect, useState, useMemo } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTrip, useUpdateTrip } from '@/hooks/useTrips';
import { Trip } from '@/services/trips';
import { Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { format, subHours, parseISO } from 'date-fns';

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

type ReminderMode = 'hours_before' | 'custom_datetime';

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
    reminder_enabled: boolean;
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
    reminder_enabled: true,
    status: 'scheduled',
    notes: '',
  });

  const [reminderMode, setReminderMode] = useState<ReminderMode>('hours_before');
  const [customReminderDate, setCustomReminderDate] = useState('');
  const [customReminderTime, setCustomReminderTime] = useState('');
  const [passengers, setPassengers] = useState<PassengerInput[]>([]);

  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();

  // Calculate reminder datetime based on mode
  const calculatedReminderDatetime = useMemo(() => {
    if (!formData.trip_date || !formData.trip_time) return null;
    
    if (reminderMode === 'custom_datetime') {
      if (customReminderDate && customReminderTime) {
        return `${customReminderDate}T${customReminderTime}`;
      }
      return null;
    }
    
    // Calculate from hours before
    const tripDatetime = new Date(`${formData.trip_date}T${formData.trip_time}`);
    const reminderDatetime = subHours(tripDatetime, formData.reminder_hours_before);
    return format(reminderDatetime, "yyyy-MM-dd'T'HH:mm");
  }, [formData.trip_date, formData.trip_time, formData.reminder_hours_before, reminderMode, customReminderDate, customReminderTime]);

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
        reminder_enabled: trip.reminder_enabled ?? true,
        status: trip.status as 'scheduled' | 'completed' | 'cancelled',
        notes: trip.notes || '',
      });
      
      // Check if custom reminder datetime was set
      if (trip.reminder_datetime) {
        const reminderDt = parseISO(trip.reminder_datetime);
        setCustomReminderDate(format(reminderDt, 'yyyy-MM-dd'));
        setCustomReminderTime(format(reminderDt, 'HH:mm'));
        setReminderMode('custom_datetime');
      } else {
        setReminderMode('hours_before');
        setCustomReminderDate('');
        setCustomReminderTime('');
      }
      
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
        reminder_enabled: true,
        status: 'scheduled',
        notes: '',
      });
      setReminderMode('hours_before');
      setCustomReminderDate('');
      setCustomReminderTime('');
      setPassengers([]);
    }
  }, [trip, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      reminder_datetime: reminderMode === 'custom_datetime' && customReminderDate && customReminderTime
        ? `${customReminderDate}T${customReminderTime}:00`
        : null,
    };

    if (trip) {
      await updateTrip.mutateAsync({
        tripId: trip.id,
        updates: submitData,
      });
    } else {
      await createTrip.mutateAsync({
        ...submitData,
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

          {/* Reminder Settings Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formData.reminder_enabled ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <Label className="text-base font-semibold">إعدادات التذكير</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="reminder_enabled" className="text-sm text-muted-foreground">
                  {formData.reminder_enabled ? 'مفعّل' : 'معطّل'}
                </Label>
                <Switch
                  id="reminder_enabled"
                  checked={formData.reminder_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
                />
              </div>
            </div>

            {formData.reminder_enabled && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={reminderMode === 'hours_before' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReminderMode('hours_before')}
                  >
                    قبل الرحلة بـ
                  </Button>
                  <Button
                    type="button"
                    variant={reminderMode === 'custom_datetime' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReminderMode('custom_datetime')}
                  >
                    تاريخ ووقت محدد
                  </Button>
                </div>

                {reminderMode === 'hours_before' ? (
                  <div className="space-y-2">
                    <Label>إرسال التذكير قبل الرحلة بـ</Label>
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
                        <SelectItem value="3">3 ساعات</SelectItem>
                        <SelectItem value="6">6 ساعات</SelectItem>
                        <SelectItem value="12">12 ساعة</SelectItem>
                        <SelectItem value="24">24 ساعة (يوم)</SelectItem>
                        <SelectItem value="48">48 ساعة (يومين)</SelectItem>
                        <SelectItem value="72">72 ساعة (3 أيام)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom_reminder_date">تاريخ التذكير</Label>
                      <Input
                        id="custom_reminder_date"
                        type="date"
                        value={customReminderDate}
                        onChange={(e) => setCustomReminderDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom_reminder_time">وقت التذكير</Label>
                      <Input
                        id="custom_reminder_time"
                        type="time"
                        value={customReminderTime}
                        onChange={(e) => setCustomReminderTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {calculatedReminderDatetime && (
                  <div className="text-sm text-muted-foreground bg-background p-2 rounded border">
                    <span className="font-medium">موعد إرسال التذكير: </span>
                    {format(new Date(calculatedReminderDatetime), 'dd/MM/yyyy الساعة HH:mm')}
                  </div>
                )}
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
