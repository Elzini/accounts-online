import { useState } from 'react';
import { Plus, Search, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface LetterOfCredit {
  id: string;
  lc_number: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  issuing_bank: string | null;
  beneficiary_name: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  created_at: string;
}

export function LettersOfCreditPage() {
  const { companyId } = useCompany();
  const [search, setSearch] = useState('');

  const { data: lcs = [], isLoading } = useQuery({
    queryKey: ['letters-of-credit', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('letters_of_credit')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LetterOfCredit[];
    },
    enabled: !!companyId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="secondary">نشط</Badge>;
      case 'expired': return <Badge variant="destructive">منتهي</Badge>;
      case 'utilized': return <Badge variant="secondary">مستخدم</Badge>;
      default: return <Badge variant="outline">مسودة</Badge>;
    }
  };

  const filtered = lcs.filter(lc =>
    lc.lc_number.includes(search) ||
    (lc.beneficiary_name || '').includes(search) ||
    (lc.issuing_bank || '').includes(search)
  );

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            خطابات الاعتماد
          </h1>
          <p className="text-muted-foreground mt-1">{lcs.length} خطاب اعتماد</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />خطاب اعتماد جديد</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الاعتماد</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>البنك المصدر</TableHead>
                <TableHead>المستفيد</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(lc => (
                <TableRow key={lc.id}>
                  <TableCell className="font-medium">{lc.lc_number}</TableCell>
                  <TableCell><Badge variant="outline">{lc.type === 'import' ? 'استيراد' : 'تصدير'}</Badge></TableCell>
                  <TableCell className="font-medium">{lc.amount.toLocaleString()} {lc.currency}</TableCell>
                  <TableCell>{lc.issuing_bank || '-'}</TableCell>
                  <TableCell>{lc.beneficiary_name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(lc.status)}</TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد خطابات اعتماد</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
