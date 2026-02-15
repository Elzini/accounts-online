import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, UserPlus, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ADMIN_ROLES = [
  {
    key: 'super_admin',
    name: 'Super Admin',
    nameAr: 'مدير النظام الرئيسي',
    description: 'صلاحيات كاملة على جميع الشركات والنظام',
    permissions: ['إدارة الشركات', 'إدارة الباقات', 'إدارة الإيرادات', 'مراقبة النظام', 'إدارة الأمان', 'الدعم الفني', 'RBAC'],
    color: 'text-destructive',
    badge: 'destructive' as const,
  },
  {
    key: 'support_admin',
    name: 'Support Admin',
    nameAr: 'مدير الدعم الفني',
    description: 'إدارة تذاكر الدعم والتواصل مع العملاء',
    permissions: ['عرض الشركات', 'إدارة التذاكر', 'التواصل مع العملاء', 'عرض سجلات النشاط'],
    color: 'text-blue-500',
    badge: 'default' as const,
  },
  {
    key: 'finance_admin',
    name: 'Finance Admin',
    nameAr: 'المدير المالي',
    description: 'إدارة الإيرادات والاشتراكات والمدفوعات',
    permissions: ['عرض الشركات', 'إدارة الباقات', 'إدارة المدفوعات', 'التقارير المالية', 'تصدير البيانات'],
    color: 'text-green-500',
    badge: 'secondary' as const,
  },
  {
    key: 'technical_admin',
    name: 'Technical Admin',
    nameAr: 'المدير التقني',
    description: 'مراقبة الأداء وإدارة البنية التحتية',
    permissions: ['مراقبة السيرفرات', 'إدارة النسخ الاحتياطي', 'سجلات الأخطاء', 'إدارة API', 'إدارة النطاقات'],
    color: 'text-purple-500',
    badge: 'outline' as const,
  },
];

export function RBACManagement() {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [removingRole, setRemovingRole] = useState<{ userId: string; role: string; username: string } | null>(null);

  // Fetch all admin users with their roles
  const { data: adminUsers = [], isLoading } = useQuery({
    queryKey: ['admin-users-rbac'],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .in('permission', ['super_admin', 'support_admin', 'finance_admin', 'technical_admin'] as any[]);

      if (!roles || roles.length === 0) return [];

      // Get profiles for these users
      const userIds = [...new Set(roles.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      // Get emails from auth (via user_id lookup in profiles)
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.username]));

      // Group roles by user
      const userMap = new Map<string, { userId: string; username: string; roles: string[]; createdAt: string }>();
      roles.forEach(r => {
        if (!userMap.has(r.user_id)) {
          userMap.set(r.user_id, {
            userId: r.user_id,
            username: profileMap.get(r.user_id) || 'مستخدم',
            roles: [],
            createdAt: r.created_at,
          });
        }
        userMap.get(r.user_id)!.roles.push(r.permission);
      });

      return Array.from(userMap.values());
    },
  });

  // Fetch all users for the add dialog
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-profiles-for-rbac'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username')
        .order('username');
      return data || [];
    },
  });

  // Add role mutation
  const addRoleMut = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Check if already exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('permission', role as any)
        .maybeSingle();

      if (existing) throw new Error('الدور موجود بالفعل');

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, permission: role } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-rbac'] });
      toast.success('تم إضافة الدور بنجاح');
      setAddDialogOpen(false);
      setSelectedUserId('');
    },
    onError: (err: any) => toast.error(err.message || 'حدث خطأ'),
  });

  // Remove role mutation
  const removeRoleMut = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('permission', role as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-rbac'] });
      toast.success('تم إزالة الدور');
      setRemoveDialogOpen(false);
      setRemovingRole(null);
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const getRoleDef = (key: string) => ADMIN_ROLES.find(r => r.key === key);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> التحكم في الصلاحيات (RBAC)</h2>
          <p className="text-muted-foreground">إدارة الأدوار والصلاحيات لمديري النظام</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> تعيين دور جديد
        </Button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ADMIN_ROLES.map(role => {
          const usersWithRole = adminUsers.filter(u => u.roles.includes(role.key));
          return (
            <Card key={role.key}>
              <CardHeader>
                <CardTitle className={`text-base flex items-center justify-between`}>
                  <span className={`flex items-center gap-2 ${role.color}`}>
                    <Shield className="w-5 h-5" />
                    {role.nameAr}
                  </span>
                  <Badge variant={role.badge}>{usersWithRole.length} مستخدم</Badge>
                </CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map(p => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
                {usersWithRole.length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    {usersWithRole.map(u => (
                      <div key={u.userId} className="flex items-center justify-between p-1.5 rounded bg-muted/50">
                        <span className="text-sm">{u.username}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          setRemovingRole({ userId: u.userId, role: role.key, username: u.username });
                          setRemoveDialogOpen(true);
                        }}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> جميع المديرين ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الأدوار</TableHead>
                  <TableHead>تاريخ التعيين</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map(u => (
                  <TableRow key={u.userId}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map(r => {
                          const def = getRoleDef(r);
                          return (
                            <Badge key={r} variant={def?.badge || 'outline'} className="text-xs">
                              {def?.nameAr || r}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(u.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>
                      {u.roles.map(r => (
                        <Button key={r} size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => {
                          setRemovingRole({ userId: u.userId, role: r, username: u.username });
                          setRemoveDialogOpen(true);
                        }}>
                          إزالة {getRoleDef(r)?.nameAr || r}
                        </Button>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">لا يوجد مديرون مسجلون</p>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعيين دور إداري</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المستخدم</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="اختر المستخدم" /></SelectTrigger>
                <SelectContent>
                  {allUsers.map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.username || u.user_id.substring(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الدور</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map(r => (
                    <SelectItem key={r.key} value={r.key}>{r.nameAr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => selectedUserId && addRoleMut.mutate({ userId: selectedUserId, role: selectedRole })} disabled={!selectedUserId}>
              تعيين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إزالة الدور</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إزالة دور "{getRoleDef(removingRole?.role || '')?.nameAr}" من المستخدم "{removingRole?.username}"؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => removingRole && removeRoleMut.mutate({ userId: removingRole.userId, role: removingRole.role })}>
              إزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
