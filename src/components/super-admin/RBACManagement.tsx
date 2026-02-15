import { useQuery } from '@tanstack/react-query';
import { Shield, Users, Key, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_ROLES = [
  {
    name: 'Super Admin',
    nameAr: 'مدير النظام الرئيسي',
    description: 'صلاحيات كاملة على جميع الشركات والنظام',
    permissions: ['إدارة الشركات', 'إدارة الباقات', 'إدارة الإيرادات', 'مراقبة النظام', 'إدارة الأمان', 'الدعم الفني', 'RBAC'],
    color: 'text-destructive',
    badge: 'destructive' as const,
  },
  {
    name: 'Support Admin',
    nameAr: 'مدير الدعم الفني',
    description: 'إدارة تذاكر الدعم والتواصل مع العملاء',
    permissions: ['عرض الشركات', 'إدارة التذاكر', 'التواصل مع العملاء', 'عرض سجلات النشاط'],
    color: 'text-blue-500',
    badge: 'default' as const,
  },
  {
    name: 'Finance Admin',
    nameAr: 'المدير المالي',
    description: 'إدارة الإيرادات والاشتراكات والمدفوعات',
    permissions: ['عرض الشركات', 'إدارة الباقات', 'إدارة المدفوعات', 'التقارير المالية', 'تصدير البيانات'],
    color: 'text-green-500',
    badge: 'secondary' as const,
  },
  {
    name: 'Technical Admin',
    nameAr: 'المدير التقني',
    description: 'مراقبة الأداء وإدارة البنية التحتية',
    permissions: ['مراقبة السيرفرات', 'إدارة النسخ الاحتياطي', 'سجلات الأخطاء', 'إدارة API', 'إدارة النطاقات'],
    color: 'text-purple-500',
    badge: 'outline' as const,
  },
];

export function RBACManagement() {
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users-rbac'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('*, profiles(username, user_id)')
        .eq('permission', 'super_admin');
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> التحكم في الصلاحيات (RBAC)</h2>
        <p className="text-muted-foreground">إدارة الأدوار والصلاحيات لمديري النظام</p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ADMIN_ROLES.map(role => (
          <Card key={role.name}>
            <CardHeader>
              <CardTitle className={`text-base flex items-center gap-2 ${role.color}`}>
                <Shield className="w-5 h-5" />
                {role.nameAr}
              </CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map(p => (
                  <Badge key={p} variant={role.badge}>{p}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> المديرون الحاليون
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>تاريخ التعيين</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.profiles?.username || 'مدير'}</TableCell>
                    <TableCell><Badge variant="destructive">Super Admin</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString('ar-SA')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">لا يوجد مديرون مسجلون</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
