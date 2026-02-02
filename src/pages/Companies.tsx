import { useEffect, useState } from 'react';
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  Car, 
  DollarSign,
  Phone,
  MapPin,
  Check,
  X,
  Eye,
  Shield,
  LogOut,
  ArrowRight,
  Settings,
  LogIn,
  BookOpen,
  FileBarChart,
  Cog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import defaultLogo from '@/assets/logo.png';
import { LoginSettingsAdmin } from '@/components/LoginSettingsAdmin';
import { AllUsersManagement } from '@/components/super-admin/AllUsersManagement';
import { CompanyAccountingSettings } from '@/components/super-admin/CompanyAccountingSettings';
import { CompaniesReport } from '@/components/super-admin/CompaniesReport';
import { DefaultCompanySettings } from '@/components/super-admin/DefaultCompanySettings';

interface Company {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CompanyStats {
  company_id: string;
  users_count: number;
  cars_count: number;
  sales_count: number;
  customers_count: number;
}

export default function Companies() {
  const { permissions, signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [headerLogoUrl, setHeaderLogoUrl] = useState<string>('');
  const [headerLogoLoaded, setHeaderLogoLoaded] = useState(false);

  useEffect(() => {
    document.title = 'إدارة الشركات';

    let mounted = true;
    const fetchHeaderLogo = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'login_logo_url')
        .is('company_id', null)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error('Error fetching global logo for companies header:', error);
        setHeaderLogoUrl('');
        setHeaderLogoLoaded(true);
        return;
      }

      setHeaderLogoUrl(data?.value || '');
      setHeaderLogoLoaded(true);
    };

    fetchHeaderLogo();

    return () => {
      mounted = false;
    };
  }, []);
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [accountingSettingsOpen, setAccountingSettingsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    is_active: true,
  });

  // Fetch companies
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Company[];
    },
  });

  // Fetch stats for all companies
  const { data: companyStats = [] } = useQuery({
    queryKey: ['company-stats'],
    queryFn: async () => {
      const stats: CompanyStats[] = [];
      
      for (const company of companies) {
        const [usersRes, carsRes, salesRes, customersRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('cars').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('sales').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
        ]);
        
        stats.push({
          company_id: company.id,
          users_count: usersRes.count || 0,
          cars_count: carsRes.count || 0,
          sales_count: salesRes.count || 0,
          customers_count: customersRes.count || 0,
        });
      }
      
      return stats;
    },
    enabled: companies.length > 0,
  });

  // Add company
  const addCompany = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
          is_active: data.is_active,
        })
        .select()
        .single();
      
      if (error) throw error;
      return newCompany;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('تم إضافة الشركة بنجاح');
      setAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة الشركة');
    },
  });

  // Update company
  const updateCompany = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: updated, error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
          is_active: data.is_active,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('تم تحديث الشركة بنجاح');
      setEditDialogOpen(false);
      setSelectedCompany(null);
      resetForm();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث الشركة');
    },
  });

  // Delete company
  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('تم حذف الشركة بنجاح');
      setDeleteDialogOpen(false);
      setSelectedCompany(null);
    },
    onError: () => {
      toast.error('لا يمكن حذف الشركة - قد تحتوي على بيانات');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      is_active: true,
    });
  };

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      phone: company.phone || '',
      address: company.address || '',
      is_active: company.is_active,
    });
    setEditDialogOpen(true);
  };

  const openDetailsDialog = (company: Company) => {
    setSelectedCompany(company);
    setDetailsDialogOpen(true);
  };

  const getCompanyStats = (companyId: string) => {
    return companyStats.find(s => s.company_id === companyId) || {
      users_count: 0,
      cars_count: 0,
      sales_count: 0,
      customers_count: 0,
    };
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  // Check if user is super admin
  if (!permissions.super_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-background">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">غير مصرح</h2>
        <p className="text-muted-foreground">هذه الصفحة متاحة فقط لمدير النظام</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          العودة للرئيسية
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {headerLogoLoaded ? (
              <img
                src={headerLogoUrl || defaultLogo}
                alt="شعار النظام"
                className="w-10 h-10 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultLogo;
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
            )}
            <div>
              <h1 className="font-bold text-lg text-foreground">إدارة الشركات</h1>
              <p className="text-xs text-muted-foreground">لوحة تحكم مدير النظام</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة للوحة التحكم
            </Button>
            <p className="text-sm text-muted-foreground hidden sm:block">{user?.email}</p>
            <Button variant="ghost" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>الشركات</span>
            </TabsTrigger>
            <TabsTrigger value="default-settings" className="flex items-center gap-2">
              <Cog className="w-4 h-4" />
              <span>الإعدادات الافتراضية</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileBarChart className="w-4 h-4" />
              <span>التقرير الشامل</span>
            </TabsTrigger>
            <TabsTrigger value="all-users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>المستخدمين</span>
            </TabsTrigger>
            <TabsTrigger value="login-settings" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>شاشة الدخول</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="default-settings">
            <DefaultCompanySettings />
          </TabsContent>

          <TabsContent value="report">
            <CompaniesReport />
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-primary" />
                  جميع الشركات
                </h2>
                <p className="text-muted-foreground mt-1">إدارة جميع الشركات المسجلة في النظام</p>
              </div>
              <Button 
                onClick={() => setAddDialogOpen(true)}
                className="gradient-primary hover:opacity-90"
              >
                <Plus className="w-5 h-5 ml-2" />
                إضافة شركة
              </Button>
            </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الشركات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companies.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">الشركات النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {companies.filter(c => c.is_active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {companyStats.reduce((sum, s) => sum + s.users_count, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي السيارات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {companyStats.reduce((sum, s) => sum + s.cars_count, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Companies Table */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-bold">#</TableHead>
                  <TableHead className="text-right font-bold">اسم الشركة</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.phone ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {company.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <Users className="w-3 h-3" />
                          {stats.users_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <Car className="w-3 h-3" />
                          {stats.cars_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <DollarSign className="w-3 h-3" />
                          {stats.sales_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {company.is_active ? (
                          <Badge className="bg-success/10 text-success hover:bg-success/20">
                            <Check className="w-3 h-3 ml-1" />
                            نشط
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted">
                            <X className="w-3 h-3 ml-1" />
                            غير نشط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(company.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openDetailsDialog(company)}
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedCompany(company);
                              setAccountingSettingsOpen(true);
                            }}
                            title="إعدادات القيود"
                            className="text-primary hover:text-primary"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openEditDialog(company)}
                            title="تعديل"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedCompany(company);
                              setDeleteDialogOpen(true);
                            }}
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {companies.length === 0 && (
              <div className="p-12 text-center">
                <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">لا يوجد شركات حتى الآن</p>
              </div>
            )}
          </div>
          </TabsContent>

          <TabsContent value="all-users">
            <AllUsersManagement />
          </TabsContent>

          <TabsContent value="login-settings">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <LogIn className="w-8 h-8 text-primary" />
                  إعدادات شاشة الدخول والتسجيل
                </h2>
                <p className="text-muted-foreground mt-1">تخصيص مظهر صفحات الدخول وتسجيل الشركات الجديدة</p>
              </div>
              <LoginSettingsAdmin />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Company Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة شركة جديدة</DialogTitle>
            <DialogDescription>
              قم بإدخال بيانات الشركة الجديدة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم الشركة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم الشركة"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="رقم الهاتف"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="عنوان الشركة"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">شركة نشطة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={() => addCompany.mutate(formData)}
              disabled={!formData.name || addCompany.isPending}
            >
              {addCompany.isPending ? 'جاري الإضافة...' : 'إضافة الشركة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الشركة</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات الشركة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">اسم الشركة *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم الشركة"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">الهاتف</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="رقم الهاتف"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">العنوان</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="عنوان الشركة"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">شركة نشطة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={() => selectedCompany && updateCompany.mutate({ id: selectedCompany.id, data: formData })}
              disabled={!formData.name || updateCompany.isPending}
            >
              {updateCompany.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف شركة "{selectedCompany?.name}"؟ 
              <br />
              سيتم حذف جميع البيانات المرتبطة بها ولا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCompany && deleteCompany.mutate(selectedCompany.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCompany.isPending ? 'جاري الحذف...' : 'حذف الشركة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Company Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              تفاصيل الشركة
            </DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">اسم الشركة</Label>
                  <p className="font-semibold text-lg">{selectedCompany.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">الحالة</Label>
                  <div className="mt-1">
                    {selectedCompany.is_active ? (
                      <Badge className="bg-success/10 text-success">نشط</Badge>
                    ) : (
                      <Badge variant="secondary">غير نشط</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">الهاتف</Label>
                  <p className="font-medium">{selectedCompany.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">العنوان</Label>
                  <p className="font-medium">{selectedCompany.address || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">تاريخ الإنشاء</Label>
                  <p className="font-medium">{formatDate(selectedCompany.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">آخر تحديث</Label>
                  <p className="font-medium">{formatDate(selectedCompany.updated_at)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground text-sm mb-3 block">إحصائيات الشركة</Label>
                <div className="grid grid-cols-4 gap-3">
                  {(() => {
                    const stats = getCompanyStats(selectedCompany.id);
                    return (
                      <>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <p className="text-xl font-bold">{stats.users_count}</p>
                          <p className="text-xs text-muted-foreground">مستخدم</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <Car className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <p className="text-xl font-bold">{stats.cars_count}</p>
                          <p className="text-xs text-muted-foreground">سيارة</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <p className="text-xl font-bold">{stats.sales_count}</p>
                          <p className="text-xs text-muted-foreground">مبيعة</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <p className="text-xl font-bold">{stats.customers_count}</p>
                          <p className="text-xs text-muted-foreground">عميل</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Company Accounting Settings Dialog */}
      {selectedCompany && (
        <CompanyAccountingSettings
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          open={accountingSettingsOpen}
          onOpenChange={setAccountingSettingsOpen}
        />
      )}
    </div>
  );
}
