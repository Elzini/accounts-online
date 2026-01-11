import { useState } from 'react';
import { Users, Shield, Check, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActivePage } from '@/types';
import { useUsers, useUpdateUserPermissions } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

interface UsersManagementProps {
  setActivePage: (page: ActivePage) => void;
}

const PERMISSIONS: { key: UserPermission; label: string }[] = [
  { key: 'sales', label: 'صلاحية المبيعات' },
  { key: 'purchases', label: 'صلاحية المشتريات' },
  { key: 'reports', label: 'صلاحية التقارير' },
  { key: 'admin', label: 'صلاحية الإدارة' },
  { key: 'users', label: 'صلاحية المستخدمين' },
];

export function UsersManagement({ setActivePage }: UsersManagementProps) {
  const { data: users = [], isLoading } = useUsers();
  const updatePermissions = useUpdateUserPermissions();
  const { permissions: myPermissions, user } = useAuth();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<UserPermission[]>([]);

  const canManageUsers = myPermissions.admin || myPermissions.users;

  const startEditing = (userId: string, currentPermissions: UserPermission[]) => {
    setEditingUser(userId);
    setSelectedPermissions([...currentPermissions]);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setSelectedPermissions([]);
  };

  const togglePermission = (permission: UserPermission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const savePermissions = async (userId: string) => {
    try {
      await updatePermissions.mutateAsync({ userId, permissions: selectedPermissions });
      toast.success('تم تحديث الصلاحيات بنجاح');
      setEditingUser(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الصلاحيات');
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">غير مصرح</h2>
        <p className="text-muted-foreground">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        <Button onClick={() => setActivePage('dashboard')} className="mt-4">
          العودة للرئيسية
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-1">إدارة المستخدمين وصلاحياتهم</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">#</TableHead>
              <TableHead className="text-right font-bold">اسم المستخدم</TableHead>
              <TableHead className="text-right font-bold">تاريخ التسجيل</TableHead>
              {PERMISSIONS.map(p => (
                <TableHead key={p.key} className="text-center font-bold text-sm">
                  {p.label}
                </TableHead>
              ))}
              <TableHead className="text-center font-bold">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u, index) => {
              const isEditing = editingUser === u.user_id;
              const isCurrentUser = u.user_id === user?.id;
              
              return (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      {u.username}
                      {isCurrentUser && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">أنت</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(u.created_at)}</TableCell>
                  {PERMISSIONS.map(p => (
                    <TableCell key={p.key} className="text-center">
                      {isEditing ? (
                        <Checkbox
                          checked={selectedPermissions.includes(p.key)}
                          onCheckedChange={() => togglePermission(p.key)}
                          disabled={isCurrentUser && p.key === 'admin'}
                        />
                      ) : (
                        u.permissions.includes(p.key) ? (
                          <Check className="w-5 h-5 text-success mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                        )
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    {isEditing ? (
                      <div className="flex gap-2 justify-center">
                        <Button 
                          size="sm" 
                          onClick={() => savePermissions(u.user_id)}
                          disabled={updatePermissions.isPending}
                          className="gradient-success"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => startEditing(u.user_id, u.permissions)}
                        disabled={isCurrentUser}
                      >
                        تعديل
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {users.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا يوجد مستخدمين حتى الآن</p>
          </div>
        )}
      </div>

      {/* Permissions Legend */}
      <div className="bg-card rounded-2xl p-6 card-shadow">
        <h3 className="font-bold mb-4">شرح الصلاحيات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-semibold text-sm">صلاحية المبيعات</p>
            <p className="text-xs text-muted-foreground">إدارة المبيعات والعملاء</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-semibold text-sm">صلاحية المشتريات</p>
            <p className="text-xs text-muted-foreground">إدارة المشتريات والموردين والمخزون</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-semibold text-sm">صلاحية التقارير</p>
            <p className="text-xs text-muted-foreground">عرض التقارير والإحصائيات</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-semibold text-sm">صلاحية الإدارة</p>
            <p className="text-xs text-muted-foreground">صلاحيات كاملة على النظام</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-semibold text-sm">صلاحية المستخدمين</p>
            <p className="text-xs text-muted-foreground">إدارة المستخدمين والصلاحيات</p>
          </div>
        </div>
      </div>
    </div>
  );
}
