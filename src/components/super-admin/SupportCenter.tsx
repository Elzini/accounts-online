import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Headphones, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; variant: string }> = {
  open: { label: 'مفتوح', variant: 'destructive' },
  in_progress: { label: 'قيد المعالجة', variant: 'default' },
  waiting_customer: { label: 'بانتظار العميل', variant: 'secondary' },
  resolved: { label: 'تم الحل', variant: 'outline' },
  closed: { label: 'مغلق', variant: 'outline' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفض', color: 'text-green-500' },
  medium: { label: 'متوسط', color: 'text-amber-500' },
  high: { label: 'عالي', color: 'text-orange-500' },
  critical: { label: 'حرج', color: 'text-destructive' },
};

const CATEGORY_MAP: Record<string, string> = {
  general: 'عام',
  billing: 'فواتير',
  technical: 'تقني',
  bug: 'خلل',
  feature_request: 'طلب ميزة',
};

export function SupportCenter() {
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets-admin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*, companies(name)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'resolved') updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets-admin'] });
      toast.success('تم تحديث حالة التذكرة');
    },
  });

  const openTickets = tickets.filter((t: any) => t.status === 'open').length;
  const inProgressTickets = tickets.filter((t: any) => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter((t: any) => ['resolved', 'closed'].includes(t.status)).length;

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Headphones className="w-6 h-6" /> مركز الدعم</h2>
        <p className="text-muted-foreground">إدارة تذاكر الدعم الفني</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">إجمالي التذاكر</p>
            <p className="text-2xl font-bold">{tickets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">مفتوحة</p>
            <p className="text-2xl font-bold text-destructive">{openTickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">قيد المعالجة</p>
            <p className="text-2xl font-bold text-amber-500">{inProgressTickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">تم الحل</p>
            <p className="text-2xl font-bold text-green-500">{resolvedTickets}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">جميع التذاكر</CardTitle></CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>الشركة</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket: any) => {
                  const priority = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;
                  const status = STATUS_MAP[ticket.status] || STATUS_MAP.open;
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-xs">{ticket.ticket_number}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{ticket.subject}</TableCell>
                      <TableCell>{ticket.companies?.name || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{CATEGORY_MAP[ticket.category] || ticket.category}</Badge></TableCell>
                      <TableCell><span className={`font-medium ${priority.color}`}>{priority.label}</span></TableCell>
                      <TableCell><Badge variant={status.variant as any}>{status.label}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(ticket.created_at).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        <Select value={ticket.status} onValueChange={v => updateStatus.mutate({ id: ticket.id, status: v })}>
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">مفتوح</SelectItem>
                            <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                            <SelectItem value="waiting_customer">بانتظار العميل</SelectItem>
                            <SelectItem value="resolved">تم الحل</SelectItem>
                            <SelectItem value="closed">مغلق</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد تذاكر دعم</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
