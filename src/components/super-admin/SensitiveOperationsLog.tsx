import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldAlert, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';

export function SensitiveOperationsLog() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: operations = [], isLoading } = useQuery({
    queryKey: ['all-sensitive-operations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sensitive_operations_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-list-for-ops'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, name');
      return data || [];
    },
  });

  const companyMap = Object.fromEntries(companies.map((c: any) => [c.id, c.name]));

  const filtered = operations.filter((op: any) => {
    const matchSearch =
      !search ||
      op.operation_type?.includes(search) ||
      op.description?.includes(search) ||
      companyMap[op.company_id]?.includes(search);
    const matchStatus = statusFilter === 'all' || op.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 ml-1" />مُعتمد</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />قيد الانتظار</Badge>;
    }
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          سجل العمليات الحساسة
          <Badge variant="outline">{filtered.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بنوع العملية أو الشركة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="approved">مُعتمد</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد عمليات مسجلة</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((op: any) => (
                <div key={op.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{op.operation_type}</span>
                      {statusBadge(op.status)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(op.created_at).toLocaleString('ar-SA')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{op.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>🏢 {companyMap[op.company_id] || 'غير معروف'}</span>
                    <span>🔐 OTP: {op.otp_verified ? '✅ تم التحقق' : '❌ لم يتحقق'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
