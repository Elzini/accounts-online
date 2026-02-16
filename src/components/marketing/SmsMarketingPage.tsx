import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Send, Users, Clock, Trash2 } from 'lucide-react';
import { useSmsCampaigns, useAddSmsCampaign, useUpdateSmsCampaign } from '@/hooks/useModuleData';

export function SmsMarketingPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', message_text: '', recipients_count: 0 });

  const { data: campaigns = [], isLoading } = useSmsCampaigns();
  const addCampaign = useAddSmsCampaign();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">التسويق عبر SMS</h1><p className="text-sm text-muted-foreground">رسائل نصية ترويجية وتنبيهات</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />حملة جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Send className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{campaigns.reduce((s: number, c: any) => s + (c.sent_count || 0), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">رسائل مرسلة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{campaigns.reduce((s: number, c: any) => s + (c.delivered_count || 0), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">تم التوصيل</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><MessageSquare className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{campaigns.length}</p><p className="text-xs text-muted-foreground">حملات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{campaigns.filter((c: any) => c.status === 'scheduled').length}</p><p className="text-xs text-muted-foreground">مجدولة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        campaigns.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد حملات.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>الحملة</TableHead><TableHead>المستلمين</TableHead><TableHead>المرسلة</TableHead><TableHead>التوصيل</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
          <TableBody>{campaigns.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{(c.recipients_count || 0).toLocaleString()}</TableCell>
              <TableCell>{(c.sent_count || 0).toLocaleString()}</TableCell>
              <TableCell>{(c.delivered_count || 0).toLocaleString()}</TableCell>
              <TableCell><Badge variant={c.status === 'sent' ? 'default' : c.status === 'scheduled' ? 'secondary' : 'outline'}>{c.status === 'sent' ? 'مرسلة' : c.status === 'scheduled' ? 'مجدولة' : 'مسودة'}</Badge></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>حملة SMS جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم الحملة *</Label><Input value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>نص الرسالة</Label><Textarea value={newCampaign.message_text} onChange={e => setNewCampaign(p => ({ ...p, message_text: e.target.value }))} /></div>
            <div><Label>عدد المستلمين</Label><Input type="number" value={newCampaign.recipients_count} onChange={e => setNewCampaign(p => ({ ...p, recipients_count: Number(e.target.value) }))} /></div>
            <Button onClick={() => { if (!newCampaign.name) return; addCampaign.mutate(newCampaign, { onSuccess: () => { setShowAdd(false); setNewCampaign({ name: '', message_text: '', recipients_count: 0 }); } }); }} disabled={addCampaign.isPending} className="w-full">{addCampaign.isPending ? 'جاري...' : 'إنشاء الحملة'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
