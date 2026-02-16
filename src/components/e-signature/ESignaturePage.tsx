import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PenTool, Plus, FileText, CheckCircle, Clock, Send } from 'lucide-react';
import { useSignatureRequests, useAddSignatureRequest, useUpdateSignatureRequest } from '@/hooks/useModuleData';

export function ESignaturePage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newReq, setNewReq] = useState({ document_name: '', signer_name: '', signer_email: '', sent_by: '' });

  const { data: documents = [], isLoading } = useSignatureRequests();
  const addReq = useAddSignatureRequest();
  const updateReq = useUpdateSignatureRequest();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><PenTool className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">التوقيع الإلكتروني</h1><p className="text-sm text-muted-foreground">توقيع العقود والمستندات إلكترونياً</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />إرسال للتوقيع</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Send className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{documents.length}</p><p className="text-xs text-muted-foreground">مستندات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{documents.filter((d: any) => d.status === 'signed').length}</p><p className="text-xs text-muted-foreground">موقّعة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{documents.filter((d: any) => d.status === 'pending').length}</p><p className="text-xs text-muted-foreground">بانتظار</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{documents.filter((d: any) => d.status === 'expired').length}</p><p className="text-xs text-muted-foreground">منتهية</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        documents.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد مستندات.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>المستند</TableHead><TableHead>الموقّع</TableHead><TableHead>البريد</TableHead><TableHead>المرسل</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
          <TableBody>{documents.map((d: any) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.document_name}</TableCell>
              <TableCell>{d.signer_name}</TableCell>
              <TableCell>{d.signer_email || '-'}</TableCell>
              <TableCell>{d.sent_by || '-'}</TableCell>
              <TableCell>{new Date(d.created_at).toLocaleDateString('ar')}</TableCell>
              <TableCell>
                <Button variant={d.status === 'signed' ? 'default' : d.status === 'pending' ? 'secondary' : 'destructive'} size="sm" className="h-6 text-xs"
                  onClick={() => { if (d.status === 'pending') updateReq.mutate({ id: d.id, status: 'signed', signed_at: new Date().toISOString() }); }}>
                  {d.status === 'signed' ? 'موقّع ✓' : d.status === 'pending' ? 'بانتظار' : 'منتهي'}
                </Button>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>إرسال مستند للتوقيع</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم المستند *</Label><Input value={newReq.document_name} onChange={e => setNewReq(p => ({ ...p, document_name: e.target.value }))} /></div>
            <div><Label>اسم الموقّع *</Label><Input value={newReq.signer_name} onChange={e => setNewReq(p => ({ ...p, signer_name: e.target.value }))} /></div>
            <div><Label>البريد الإلكتروني</Label><Input value={newReq.signer_email} onChange={e => setNewReq(p => ({ ...p, signer_email: e.target.value }))} /></div>
            <div><Label>المرسل</Label><Input value={newReq.sent_by} onChange={e => setNewReq(p => ({ ...p, sent_by: e.target.value }))} /></div>
            <Button onClick={() => { if (!newReq.document_name || !newReq.signer_name) return; addReq.mutate(newReq, { onSuccess: () => { setShowAdd(false); setNewReq({ document_name: '', signer_name: '', signer_email: '', sent_by: '' }); } }); }} disabled={addReq.isPending} className="w-full">{addReq.isPending ? 'جاري...' : 'إرسال للتوقيع'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
