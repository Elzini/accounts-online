/**
 * Companies Tab - Table & Stats Cards
 */
import { Building2, Plus, Pencil, Trash2, Users, Car, DollarSign, Phone, Check, X, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ACTIVITY_TYPE_LABELS, type CompanyActivityType, type useCompaniesData } from './useCompaniesData';

type HookReturn = ReturnType<typeof useCompaniesData>;

interface CompaniesTabContentProps {
  hook: HookReturn;
}

export function CompaniesTabContent({ hook }: CompaniesTabContentProps) {
  const { companies, companyStats, getCompanyStats, formatDate, setAddDialogOpen, openEditDialog, openDetailsDialog, setSelectedCompany, setDeleteDialogOpen, setAccountingSettingsOpen } = hook;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" /> جميع الشركات
          </h2>
          <p className="text-muted-foreground mt-1">إدارة جميع الشركات المسجلة في النظام</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gradient-primary hover:opacity-90">
          <Plus className="w-5 h-5 ml-2" /> إضافة شركة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الشركات</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{companies.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">الشركات النشطة</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success">{companies.filter(c => c.is_active).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المستخدمين</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{companyStats.reduce((sum, s) => sum + s.users_count, 0)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">إجمالي السيارات</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{companyStats.reduce((sum, s) => sum + s.cars_count, 0)}</div></CardContent></Card>
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">#</TableHead>
              <TableHead className="text-right font-bold">اسم الشركة</TableHead>
              <TableHead className="text-right font-bold">نوع النشاط</TableHead>
              <TableHead className="text-right font-bold">الهاتف</TableHead>
              <TableHead className="text-center font-bold">المستخدمين</TableHead>
              <TableHead className="text-center font-bold">السيارات</TableHead>
              <TableHead className="text-center font-bold">المبيعات</TableHead>
              <TableHead className="text-center font-bold">الحالة</TableHead>
              <TableHead className="text-right font-bold">تاريخ الإنشاء</TableHead>
              <TableHead className="text-center font-bold">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company, index) => {
              const stats = getCompanyStats(company.id);
              return (
                <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><span className="font-semibold">{company.name}</span></div></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{ACTIVITY_TYPE_LABELS[(company.company_type || 'general_trading') as CompanyActivityType]}</Badge></TableCell>
                  <TableCell>{company.phone ? <div className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" />{company.phone}</div> : <span className="text-muted-foreground/50">-</span>}</TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className="gap-1"><Users className="w-3 h-3" />{stats.users_count}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className="gap-1"><Car className="w-3 h-3" />{stats.cars_count}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className="gap-1"><DollarSign className="w-3 h-3" />{stats.sales_count}</Badge></TableCell>
                  <TableCell className="text-center">
                    {company.is_active ? <Badge className="bg-success/10 text-success hover:bg-success/20"><Check className="w-3 h-3 ml-1" />نشط</Badge> : <Badge variant="secondary" className="bg-muted"><X className="w-3 h-3 ml-1" />غير نشط</Badge>}
                  </TableCell>
                  <TableCell>{formatDate(company.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="outline" onClick={() => openDetailsDialog(company)} title="عرض التفاصيل"><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedCompany(company); setAccountingSettingsOpen(true); }} title="إعدادات القيود" className="text-primary hover:text-primary"><BookOpen className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(company)} title="تعديل"><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setSelectedCompany(company); setDeleteDialogOpen(true); }} title="حذف"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {companies.length === 0 && (
          <div className="p-12 text-center"><Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">لا يوجد شركات حتى الآن</p></div>
        )}
      </div>
    </div>
  );
}
