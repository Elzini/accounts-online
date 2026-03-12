import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Globe, Link2, Copy, Trash2, Plus, CheckCircle, ExternalLink, Package, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

interface PortalSupplier {
  id: string;
  supplier_id: string;
  supplier_name: string;
  token: string;
  is_active: boolean;
  last_accessed_at: string | null;
  created_at: string;
}

export function SupplierPortalPage() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const companyId = useCompanyId();
  const [portalSuppliers, setPortalSuppliers] = useState<PortalSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [copiedToken, setCopiedToken] = useState('');

  const portalBaseUrl = `${window.location.origin}/supplier-portal`;

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const [tokensRes, suppliersRes] = await Promise.all([
      supabase.from('supplier_portal_tokens' as any).select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('suppliers').select('id, name').eq('company_id', companyId).order('name'),
    ]);
    setPortalSuppliers((tokensRes.data || []) as any[]);
    setSuppliers(suppliersRes.data || []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addPortalAccess = async () => {
    if (!companyId || !selectedSupplierId) return;
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const existing = portalSuppliers.find(p => p.supplier_id === selectedSupplierId);
    if (existing) {
      toast.error(isRtl ? 'المورد مضاف مسبقاً' : 'Supplier already has access');
      return;
    }

    const { error } = await supabase.from('supplier_portal_tokens' as any).insert({
      company_id: companyId,
      supplier_id: selectedSupplierId,
      supplier_name: supplier.name,
    } as any);

    if (error) {
      toast.error(isRtl ? 'خطأ في الإضافة' : 'Error adding');
      return;
    }
    toast.success(isRtl ? 'تم إضافة وصول المورد' : 'Supplier portal access added');
    setShowAddDialog(false);
    setSelectedSupplierId('');
    fetchData();
  };

  const toggleAccess = async (id: string, active: boolean) => {
    await supabase.from('supplier_portal_tokens' as any).update({ is_active: active } as any).eq('id', id);
    fetchData();
  };

  const deleteAccess = async (id: string) => {
    await supabase.from('supplier_portal_tokens' as any).delete().eq('id', id);
    toast.success(isRtl ? 'تم الحذف' : 'Deleted');
    fetchData();
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${portalBaseUrl}?token=${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2000);
    toast.success(isRtl ? 'تم نسخ الرابط' : 'Link copied');
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-7 w-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">{isRtl ? 'بوابة الموردين' : 'Supplier Portal'}</h2>
            <p className="text-sm text-muted-foreground">{isRtl ? 'منح الموردين وصول لمتابعة فواتيرهم ومدفوعاتهم' : 'Give suppliers access to track their invoices and payments'}</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 me-2" /> {isRtl ? 'إضافة مورد' : 'Add Supplier'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{portalSuppliers.length}</p>
              <p className="text-sm text-muted-foreground">{isRtl ? 'إجمالي الموردين' : 'Total Suppliers'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{portalSuppliers.filter(p => p.is_active).length}</p>
              <p className="text-sm text-muted-foreground">{isRtl ? 'نشط' : 'Active'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Link2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{portalSuppliers.filter(p => p.last_accessed_at).length}</p>
              <p className="text-sm text-muted-foreground">{isRtl ? 'زاروا البوابة' : 'Visited Portal'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRtl ? 'المورد' : 'Supplier'}</TableHead>
                <TableHead>{isRtl ? 'الحالة' : 'Status'}</TableHead>
                <TableHead>{isRtl ? 'آخر زيارة' : 'Last Visit'}</TableHead>
                <TableHead>{isRtl ? 'الرابط' : 'Link'}</TableHead>
                <TableHead>{isRtl ? 'تفعيل' : 'Active'}</TableHead>
                <TableHead>{isRtl ? 'إجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{isRtl ? 'جاري التحميل...' : 'Loading...'}</TableCell></TableRow>
              ) : portalSuppliers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{isRtl ? 'لا يوجد موردين بعد' : 'No suppliers yet'}</TableCell></TableRow>
              ) : portalSuppliers.map((ps) => (
                <TableRow key={ps.id}>
                  <TableCell className="font-medium">{ps.supplier_name}</TableCell>
                  <TableCell>
                    <Badge variant={ps.is_active ? 'default' : 'secondary'}>
                      {ps.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Disabled')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ps.last_accessed_at ? new Date(ps.last_accessed_at).toLocaleDateString('ar-SA') : (isRtl ? 'لم يزر بعد' : 'Not yet')}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => copyLink(ps.token)}>
                      {copiedToken === ps.token ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(`${portalBaseUrl}?token=${ps.token}`, '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Switch checked={ps.is_active} onCheckedChange={(v) => toggleAccess(ps.id, v)} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAccess(ps.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRtl ? 'إضافة وصول مورد للبوابة' : 'Add Supplier Portal Access'}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>{isRtl ? 'اختر المورد' : 'Select Supplier'}</Label>
            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
              <SelectTrigger><SelectValue placeholder={isRtl ? 'اختر مورداً' : 'Choose supplier'} /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{isRtl ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={addPortalAccess} disabled={!selectedSupplierId}>{isRtl ? 'إضافة' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
