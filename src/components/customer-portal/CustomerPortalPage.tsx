import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Globe, FileText, DollarSign, MessageSquare, User, Link2, Copy, Trash2, Plus, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';

interface PortalCustomer {
  id: string;
  customer_id: string;
  customer_name: string;
  token: string;
  is_active: boolean;
  last_accessed_at: string | null;
  created_at: string;
}

interface CustomerOption {
  id: string;
  name: string;
}

interface SaleRecord {
  id: string;
  sale_number: number;
  customer_id: string;
  customer_name: string;
  sale_price: number;
  sale_date: string;
  due_date: string | null;
  payment_status: string | null;
}

export function CustomerPortalPage() {
  const companyId = useCompanyId();
  const [portalCustomers, setPortalCustomers] = useState<PortalCustomer[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');

  const portalBaseUrl = `${window.location.origin}/portal`;

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    const [tokensRes, salesRes, customersRes] = await Promise.all([
      supabase
        .from('customer_portal_tokens')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('sales')
        .select('id, sale_number, customer_id, sale_price, sale_date, due_date, payment_status')
        .eq('company_id', companyId)
        .order('sale_date', { ascending: false })
        .limit(50),
      supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name'),
    ]);

    const customerMap = new Map<string, string>();
    (customersRes.data || []).forEach(c => customerMap.set(c.id, c.name));
    setCustomers(customersRes.data || []);

    if (tokensRes.data) {
      setPortalCustomers(tokensRes.data.map(t => ({
        ...t,
        customer_name: customerMap.get(t.customer_id) || 'غير معروف',
      })));
    }

    if (salesRes.data) {
      setSales(salesRes.data.map(s => ({
        ...s,
        customer_name: customerMap.get(s.customer_id || '') || 'غير معروف',
      })));
    }

    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addPortalAccess = async () => {
    if (!companyId || !selectedCustomerId) return;
    const { error } = await supabase.from('customer_portal_tokens').insert({
      company_id: companyId,
      customer_id: selectedCustomerId,
    });
    if (error) {
      if (error.code === '23505') toast.error('هذا العميل لديه وصول بالفعل');
      else toast.error('خطأ في إضافة الوصول');
    } else {
      toast.success('تم إنشاء رابط البوابة للعميل');
      setShowAddDialog(false);
      setSelectedCustomerId('');
      fetchData();
    }
  };

  const toggleAccess = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('customer_portal_tokens').update({ is_active: !isActive }).eq('id', id);
    if (error) toast.error('خطأ في التحديث');
    else { toast.success(isActive ? 'تم تعطيل الوصول' : 'تم تفعيل الوصول'); fetchData(); }
  };

  const deleteAccess = async (id: string) => {
    const { error } = await supabase.from('customer_portal_tokens').delete().eq('id', id);
    if (error) toast.error('خطأ في الحذف');
    else { toast.success('تم حذف وصول العميل'); fetchData(); }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${portalBaseUrl}?token=${token}`);
    toast.success('تم نسخ رابط البوابة');
  };

  const activeCount = portalCustomers.filter(p => p.is_active).length;
  const pendingSales = sales.filter(s => s.payment_status !== 'paid').length;
  const totalDue = sales.filter(s => s.payment_status !== 'paid').reduce((s, r) => s + Number(r.sale_price || 0), 0);

  const filteredCustomers = customers.filter(c =>
    c.name.includes(searchCustomer) && !portalCustomers.some(p => p.customer_id === c.id)
  );

  const paymentStatusLabel: Record<string, string> = { paid: 'مدفوع', pending: 'معلق', partial: 'جزئي', overdue: 'متأخر' };
  const paymentStatusVariant = (s: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (s === 'paid') return 'default';
    if (s === 'overdue') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">بوابة العملاء الذاتية</h1>
          <p className="text-muted-foreground">إدارة وصول العملاء للفواتير والطلبات</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4" />إضافة عميل للبوابة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><User className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{activeCount}</div><p className="text-sm text-muted-foreground">عملاء مفعّلين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{pendingSales}</div><p className="text-sm text-muted-foreground">فواتير معلقة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{totalDue.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">مستحقات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Globe className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{portalCustomers.length}</div><p className="text-sm text-muted-foreground">إجمالي الروابط</p></CardContent></Card>
      </div>

      <Tabs defaultValue="access">
        <TabsList>
          <TabsTrigger value="access">وصول العملاء</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">العملاء المسجلين في البوابة</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p>
              ) : portalCustomers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">لا يوجد عملاء مسجلين. أضف عميلاً للبوابة.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العميل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>آخر دخول</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portalCustomers.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.customer_name}</TableCell>
                        <TableCell>
                          <Badge variant={p.is_active ? 'default' : 'secondary'}>
                            {p.is_active ? 'مفعّل' : 'معطّل'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.last_accessed_at ? new Date(p.last_accessed_at).toLocaleDateString('ar-SA') : 'لم يدخل بعد'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(p.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => copyLink(p.token)} title="نسخ الرابط">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Switch checked={p.is_active} onCheckedChange={() => toggleAccess(p.id, p.is_active)} />
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAccess(p.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">آخر الفواتير</CardTitle></CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">لا توجد فواتير</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الاستحقاق</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono">INV-{s.sale_number}</TableCell>
                        <TableCell>{s.customer_name}</TableCell>
                        <TableCell>{Number(s.sale_price).toLocaleString()} ر.س</TableCell>
                        <TableCell>{s.sale_date}</TableCell>
                        <TableCell>{s.due_date || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={paymentStatusVariant(s.payment_status)}>
                            {paymentStatusLabel[s.payment_status || 'pending'] || 'معلق'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Customer to Portal Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إضافة عميل للبوابة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>بحث عن عميل</Label>
              <Input
                placeholder="اكتب اسم العميل..."
                value={searchCustomer}
                onChange={e => setSearchCustomer(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {customers.length === 0 ? 'لا يوجد عملاء. أضف عملاء أولاً.' : 'لا توجد نتائج'}
                </p>
              ) : (
                filteredCustomers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedCustomerId === c.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <p className="text-sm font-medium">{c.name}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addPortalAccess} disabled={!selectedCustomerId}>إنشاء رابط البوابة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
