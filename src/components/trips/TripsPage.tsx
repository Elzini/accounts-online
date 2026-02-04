import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Bell,
  MapPin,
  Clock,
  Calendar,
  Phone,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useTrips, useDeleteTrip, useUpdateTrip, useSendTripReminder } from '@/hooks/useTrips';
import { Trip } from '@/services/trips';
import TripFormDialog from './TripFormDialog';
import TripPassengersDialog from './TripPassengersDialog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const TripsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [passengersDialogTrip, setPassengersDialogTrip] = useState<Trip | null>(null);

  const { data: trips = [], isLoading } = useTrips();
  const deleteTrip = useDeleteTrip();
  const updateTrip = useUpdateTrip();
  const sendReminder = useSendTripReminder();

  const filteredTrips = trips.filter(
    (trip) =>
      trip.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.departure_point.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.customer_phone.includes(searchQuery)
  );

  const handleEdit = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (tripToDelete) {
      await deleteTrip.mutateAsync(tripToDelete.id);
      setTripToDelete(null);
    }
  };

  const handleStatusChange = async (trip: Trip, status: 'scheduled' | 'completed' | 'cancelled') => {
    await updateTrip.mutateAsync({
      tripId: trip.id,
      updates: { status },
    });
  };

  const handleSendReminder = async (trip: Trip) => {
    await sendReminder.mutateAsync(trip.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">مجدولة</Badge>;
      case 'completed':
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">مكتملة</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغية</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الرحلات</h1>
          <p className="text-muted-foreground">إدارة جدول الرحلات والتذكيرات</p>
        </div>
        <Button onClick={() => { setSelectedTrip(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة رحلة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              قائمة الرحلات ({filteredTrips.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد رحلات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">الوجهة</TableHead>
                    <TableHead className="text-right">نقطة الانطلاق</TableHead>
                    <TableHead className="text-right">التاريخ والوقت</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التذكير</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">{trip.trip_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trip.customer_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {trip.customer_phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{trip.destination}</TableCell>
                      <TableCell>{trip.departure_point}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(trip.trip_date), 'dd/MM/yyyy', { locale: ar })}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {trip.trip_time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{trip.price?.toLocaleString()} ريال</TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell>
                        {trip.reminder_sent ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            تم الإرسال
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 ml-1" />
                            قبل {trip.reminder_hours_before} ساعة
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPassengersDialogTrip(trip)}
                            title="المسافرين"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          {!trip.reminder_sent && trip.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendReminder(trip)}
                              disabled={sendReminder.isPending}
                              title="إرسال تذكير الآن"
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(trip)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTripToDelete(trip)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Form Dialog */}
      <TripFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        trip={selectedTrip}
      />

      {/* Passengers Dialog */}
      {passengersDialogTrip && (
        <TripPassengersDialog
          open={!!passengersDialogTrip}
          onOpenChange={(open) => !open && setPassengersDialogTrip(null)}
          trip={passengersDialogTrip}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!tripToDelete} onOpenChange={() => setTripToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الرحلة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الرحلة إلى "{tripToDelete?.destination}" بشكل نهائي.
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TripsPage;
