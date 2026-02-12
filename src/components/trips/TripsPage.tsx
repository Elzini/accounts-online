import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Bell, MapPin, Clock, Calendar, Phone, Users, CheckCircle, XCircle } from 'lucide-react';
import { useTrips, useDeleteTrip, useUpdateTrip, useSendTripReminder } from '@/hooks/useTrips';
import { Trip } from '@/services/trips';
import TripFormDialog from './TripFormDialog';
import TripPassengersDialog from './TripPassengersDialog';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

const TripsPage = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [passengersDialogTrip, setPassengersDialogTrip] = useState<Trip | null>(null);

  const { data: trips = [], isLoading } = useTrips();
  const deleteTrip = useDeleteTrip();
  const updateTrip = useUpdateTrip();
  const sendReminder = useSendTripReminder();
  const dateLocale = language === 'ar' ? ar : enUS;

  const filteredTrips = trips.filter(
    (trip) =>
      trip.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.departure_point.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.customer_phone.includes(searchQuery)
  );

  const handleEdit = (trip: Trip) => { setSelectedTrip(trip); setIsFormOpen(true); };
  const handleDelete = async () => { if (tripToDelete) { await deleteTrip.mutateAsync(tripToDelete.id); setTripToDelete(null); } };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="secondary">{t.trips_status_scheduled}</Badge>;
      case 'completed': return <Badge className="bg-green-600 hover:bg-green-700 text-white">{t.trips_status_completed}</Badge>;
      case 'cancelled': return <Badge variant="destructive">{t.trips_status_cancelled}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.trips_title}</h1>
          <p className="text-muted-foreground">{t.trips_subtitle}</p>
        </div>
        <Button onClick={() => { setSelectedTrip(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 ml-2" />
          {t.trips_add}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t.trips_list} ({filteredTrips.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t.trips_search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t.loading}</div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t.trips_no_trips}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t.trips_number}</TableHead>
                    <TableHead className="text-right">{t.trips_customer}</TableHead>
                    <TableHead className="text-right">{t.trips_destination}</TableHead>
                    <TableHead className="text-right">{t.trips_departure}</TableHead>
                    <TableHead className="text-right">{t.trips_datetime}</TableHead>
                    <TableHead className="text-right">{t.trips_price}</TableHead>
                    <TableHead className="text-right">{t.status}</TableHead>
                    <TableHead className="text-right">{t.trips_reminder}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
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
                            <Phone className="h-3 w-3" />{trip.customer_phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{trip.destination}</TableCell>
                      <TableCell>{trip.departure_point}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(trip.trip_date), 'dd/MM/yyyy', { locale: dateLocale })}</span>
                          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{trip.trip_time}</span>
                        </div>
                      </TableCell>
                      <TableCell>{trip.price?.toLocaleString()} {t.trips_currency}</TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell>
                        {trip.reminder_sent ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-3 w-3 ml-1" />{t.trips_reminder_sent}</Badge>
                        ) : (
                          <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />{language === 'ar' ? `قبل ${trip.reminder_hours_before} ساعة` : `${trip.reminder_hours_before} ${t.trips_reminder_before} before`}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setPassengersDialogTrip(trip)} title={t.trips_passengers}><Users className="h-4 w-4" /></Button>
                          {!trip.reminder_sent && trip.status === 'scheduled' && (
                            <Button variant="ghost" size="icon" onClick={() => sendReminder.mutateAsync(trip.id)} disabled={sendReminder.isPending} title={t.trips_send_reminder}><Bell className="h-4 w-4" /></Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(trip)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setTripToDelete(trip)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      <TripFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} trip={selectedTrip} />
      {passengersDialogTrip && <TripPassengersDialog open={!!passengersDialogTrip} onOpenChange={(open) => !open && setPassengersDialogTrip(null)} trip={passengersDialogTrip} />}

      <AlertDialog open={!!tripToDelete} onOpenChange={() => setTripToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.trips_delete_confirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `سيتم حذف الرحلة إلى "${tripToDelete?.destination}" بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.`
                : `The trip to "${tripToDelete?.destination}" will be permanently deleted. This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TripsPage;
