import { useState } from 'react';
import { Users, Shield, Check, X, Save, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { ActivePage } from '@/types';
import { useUsers, useUpdateUserPermissions, useUpdateUsername, useCreateUser, useDeleteUser } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

interface UsersManagementProps {
  setActivePage: (page: ActivePage) => void;
}

const PERMISSIONS: { key: UserPermission; label: string }[] = [
  { key: 'sales', label: 'المبيعات' },
  { key: 'purchases', label: 'المشتريات' },
  { key: 'reports', label: 'التقارير' },
  { key: 'admin', label: 'الإدارة' },
  { key: 'users', label: 'المستخدمين' },
  { key: 'super_admin', label: 'مدير النظام' },
];

export function UsersManagement({ setActivePage }: UsersManagementProps) {
  const { data: users = [], isLoading } = useUsers();
  const updatePermissions = useUpdateUserPermissions();
  const updateUsername = useUpdateUsername();
  const createUser = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const { permissions: myPermissions, user } = useAuth();
  
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<UserPermission[]>([]);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);
  
  // Add user dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPermissions, setNewUserPermissions] = useState<UserPermission[]>([]);

  const canManageUsers = myPermissions.admin || myPermissions.users || myPermissions.super_admin;

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

  const toggleNewUserPermission = (permission: UserPermission) => {
    setNewUserPermissions(prev => 
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

  const startEditingUsername = (userId: string, currentUsername: string) => {
    setEditingUsername(userId);
    setNewUsername(currentUsername);
  };

  const saveUsername = async (userId: string) => {
    if (!newUsername.trim()) {
      toast.error('اسم المستخدم مطلوب');
      return;
    }
    try {
      await updateUsername.mutateAsync({ userId, username: newUsername.trim() });
      toast.success('تم تحديث اسم المستخدم بنجاح');
      setEditingUsername(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث اسم المستخدم');
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserName.trim()) {
      toast.error('جميع الحقول مطلوبة');
      return;
    }
    if (newUserPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    try {
      await createUser.mutateAsync({
        email: newUserEmail.trim(),
        password: newUserPassword,
        username: newUserName.trim(),
        permissions: newUserPermissions,
      });
      toast.success('تم إضافة المستخدم بنجاح');
      setAddDialogOpen(false);
      resetAddForm();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إضافة المستخدم');
    }
  };

  const resetAddForm = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserName('');
    setNewUserPermissions([]);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      toast.success('تم حذف المستخدم بنجاح');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف المستخدم');
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
        <Button 
          onClick={() => setAddDialogOpen(true)}
          className="gradient-primary hover:opacity-90"
        >
          <UserPlus className="w-5 h-5 ml-2" />
          إضافة مستخدم
        </Button>
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
              const isEditingName = editingUsername === u.user_id;
              const isCurrentUser = u.user_id === user?.id;
              
              return (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-semibold">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="w-32 h-8"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => saveUsername(u.user_id)}
                          disabled={updateUsername.isPending}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingUsername(null)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        {u.username}
                        {isCurrentUser && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">أنت</span>
                        )}
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => startEditingUsername(u.user_id, u.username)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
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
                      <div className="flex gap-2 justify-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startEditing(u.user_id, u.permissions)}
                          disabled={isCurrentUser}
                        >
                          تعديل الصلاحيات
                        </Button>
                        {!isCurrentUser && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setUserToDelete({ id: u.user_id, username: u.username });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
            <p className="text-xs text-muted-foreground">صلاحيات كاملة على الشركة</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-semibold text-sm">صلاحية المستخدمين</p>
            <p className="text-xs text-muted-foreground">إدارة مستخدمي الشركة والصلاحيات</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10">
            <p className="font-semibold text-sm text-warning">مدير النظام</p>
            <p className="text-xs text-muted-foreground">صلاحيات كاملة على جميع الشركات</p>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            <DialogDescription>
              قم بإدخال بيانات المستخدم الجديد وتحديد صلاحياته
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="أدخل اسم المستخدم"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                dir="ltr"
              />
            </div>
            <div className="grid gap-2">
              <Label>الصلاحيات</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map(p => (
                  <div key={p.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`new-${p.key}`}
                      checked={newUserPermissions.includes(p.key)}
                      onCheckedChange={() => toggleNewUserPermission(p.key)}
                    />
                    <Label htmlFor={`new-${p.key}`} className="text-sm cursor-pointer">
                      {p.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetAddForm(); }}>
              إلغاء
            </Button>
            <Button onClick={handleAddUser} disabled={createUser.isPending}>
              {createUser.isPending ? 'جاري الإضافة...' : 'إضافة المستخدم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف المستخدم؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المستخدم "{userToDelete?.username}" وجميع صلاحياته نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? 'جاري الحذف...' : 'حذف المستخدم'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
