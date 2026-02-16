import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, MapPin, Users, Ticket, Clock, Trash2 } from 'lucide-react';
import { useEvents, useAddEvent, useDeleteEvent } from '@/hooks/useModuleData';

export function EventsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', event_type: 'conference', location: '', start_date: '', end_date: '', max_attendees: 0, ticket_price: 0, description: '' });

  const { data: events = [], isLoading } = useEvents();
  const addEvent = useAddEvent();
  const deleteEvent = useDeleteEvent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><Calendar className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">الأحداث والفعاليات</h1><p className="text-sm text-muted-foreground">إدارة المؤتمرات والمعارض</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />فعالية جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Calendar className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{events.length}</p><p className="text-xs text-muted-foreground">فعاليات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{events.reduce((s: number, e: any) => s + (e.current_attendees || 0), 0)}</p><p className="text-xs text-muted-foreground">المسجلين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Ticket className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{events.filter((e: any) => e.status === 'draft').length}</p><p className="text-xs text-muted-foreground">مسودات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{events.filter((e: any) => e.status === 'upcoming' || e.status === 'draft').length}</p><p className="text-xs text-muted-foreground">قادمة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        events.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد فعاليات.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>الفعالية</TableHead><TableHead>النوع</TableHead><TableHead>الموقع</TableHead><TableHead>التاريخ</TableHead><TableHead>السعة</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>{events.map((e: any) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.name}</TableCell>
              <TableCell><Badge variant="outline">{e.event_type}</Badge></TableCell>
              <TableCell className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location || '-'}</TableCell>
              <TableCell>{e.start_date ? new Date(e.start_date).toLocaleDateString('ar') : '-'}</TableCell>
              <TableCell>{e.max_attendees || '-'}</TableCell>
              <TableCell><Badge variant={e.status === 'upcoming' ? 'default' : 'secondary'}>{e.status === 'upcoming' ? 'قادمة' : e.status === 'completed' ? 'مكتملة' : 'مسودة'}</Badge></TableCell>
              <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteEvent.mutate(e.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>فعالية جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم الفعالية *</Label><Input value={newEvent.name} onChange={e => setNewEvent(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>النوع</Label><Input value={newEvent.event_type} onChange={e => setNewEvent(p => ({ ...p, event_type: e.target.value }))} placeholder="مؤتمر، ورشة..." /></div>
              <div><Label>الموقع</Label><Input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>تاريخ البداية</Label><Input type="datetime-local" value={newEvent.start_date} onChange={e => setNewEvent(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>تاريخ النهاية</Label><Input type="datetime-local" value={newEvent.end_date} onChange={e => setNewEvent(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>السعة</Label><Input type="number" value={newEvent.max_attendees} onChange={e => setNewEvent(p => ({ ...p, max_attendees: Number(e.target.value) }))} /></div>
              <div><Label>سعر التذكرة</Label><Input type="number" value={newEvent.ticket_price} onChange={e => setNewEvent(p => ({ ...p, ticket_price: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>الوصف</Label><Textarea value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} /></div>
            <Button onClick={() => { if (!newEvent.name || !newEvent.start_date) return; addEvent.mutate(newEvent, { onSuccess: () => { setShowAdd(false); setNewEvent({ name: '', event_type: 'conference', location: '', start_date: '', end_date: '', max_attendees: 0, ticket_price: 0, description: '' }); } }); }} disabled={addEvent.isPending} className="w-full">{addEvent.isPending ? 'جاري...' : 'إضافة الفعالية'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
