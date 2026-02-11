import { useState } from 'react';
import { Users, Shield, Check, X, Save, UserPlus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface PermissionGroup {
  label: string;
  permissions: { key: UserPermission; label: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'المبيعات والمشتريات',
    permissions: [
      { key: 'sales', label: 'المبيعات' },
      { key: 'purchases', label: 'المشتريات' },
      { key: 'customers', label: 'العملاء' },
      { key: 'suppliers', label: 'الموردين' },
      { key: 'sales_invoices', label: 'فواتير البيع' },
      { key: 'purchase_invoices', label: 'فواتير الشراء' },
      { key: 'quotations', label: 'عروض الأسعار' },
      { key: 'partner_dealerships', label: 'المعارض الشريكة' },
      { key: 'car_transfers', label: 'تحويلات السيارات' },
    ],
  },
  {
    label: 'المحاسبة',
    permissions: [
      { key: 'financial_accounting', label: 'المحاسبة المالية' },
      { key: 'chart_of_accounts', label: 'شجرة الحسابات' },
      { key: 'journal_entries', label: 'دفتر اليومية' },
      { key: 'general_ledger', label: 'دفتر الأستاذ' },
      { key: 'account_statement', label: 'كشف حساب مفصل' },
      { key: 'fiscal_years', label: 'السنوات المالية' },
      { key: 'tax_settings', label: 'إعدادات الضريبة' },
      { key: 'cost_centers', label: 'مراكز التكلفة' },
      { key: 'fixed_assets', label: 'الأصول الثابتة' },
      { key: 'vouchers', label: 'سندات القبض والصرف' },
      { key: 'expenses', label: 'المصروفات' },
      { key: 'prepaid_expenses', label: 'المصروفات المقدمة' },
      { key: 'installments', label: 'الأقساط' },
      { key: 'checks', label: 'الشيكات' },
    ],
  },
  {
    label: 'التقارير والقوائم المالية',
    permissions: [
      { key: 'reports', label: 'التقارير' },
      { key: 'all_reports', label: 'جميع التقارير' },
      { key: 'financial_reports', label: 'التقارير المالية' },
      { key: 'financial_statements', label: 'القوائم المالية الشاملة' },
      { key: 'trial_balance', label: 'تحليل ميزان المراجعة' },
      { key: 'vat_return', label: 'إقرار ضريبة القيمة المضافة' },
      { key: 'zakat_reports', label: 'القوائم الزكوية' },
      { key: 'aging_report', label: 'أعمار الذمم' },
      { key: 'financial_kpis', label: 'المؤشرات المالية' },
      { key: 'budgets', label: 'الموازنة التقديرية' },
    ],
  },
  {
    label: 'البنوك والتمويل',
    permissions: [
      { key: 'banking', label: 'إدارة البنوك' },
      { key: 'financing', label: 'شركات التمويل' },
      { key: 'currencies', label: 'العملات وأسعار الصرف' },
    ],
  },
  {
    label: 'الموارد البشرية',
    permissions: [
      { key: 'employees', label: 'الموظفين' },
      { key: 'payroll', label: 'مسير الرواتب' },
      { key: 'attendance', label: 'الحضور والانصراف' },
      { key: 'leaves', label: 'الإجازات' },
    ],
  },
  {
    label: 'المستودعات والتصنيع',
    permissions: [
      { key: 'warehouses', label: 'المستودعات' },
      { key: 'manufacturing', label: 'التصنيع' },
    ],
  },
  {
    label: 'الإدارة والنظام',
    permissions: [
      { key: 'admin', label: 'الإدارة العامة' },
      { key: 'users', label: 'إدارة المستخدمين' },
      { key: 'control_center', label: 'مركز التحكم' },
      { key: 'accounting_audit', label: 'فحص النظام الحسابي' },
      { key: 'app_settings', label: 'إعدادات النظام' },
      { key: 'theme_settings', label: 'إعدادات الظهور' },
      { key: 'branches', label: 'إدارة الفروع' },
      { key: 'approvals', label: 'الموافقات' },
      { key: 'tasks', label: 'إدارة المهام' },
      { key: 'custody', label: 'إدارة العهد' },
      { key: 'integrations', label: 'التكاملات الخارجية' },
      { key: 'medad_import', label: 'استيراد من مداد' },
    ],
  },
];

// Flat list for quick lookups
const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions);

function PermissionsEditor({
  selected,
  onToggle,
  disabledKeys = [],
}: {
  selected: UserPermission[];
  onToggle: (key: UserPermission) => void;
  disabledKeys?: UserPermission[];
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleAllInGroup = (group: PermissionGroup, checked: boolean) => {
    group.permissions.forEach(p => {
      if (disabledKeys.includes(p.key)) return;
      const isSelected = selected.includes(p.key);
      if (checked && !isSelected) onToggle(p.key);
      if (!checked && isSelected) onToggle(p.key);
    });
  };

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="space-y-3 p-1">
        {PERMISSION_GROUPS.map(group => {
          const isCollapsed = collapsed[group.label];
          const groupSelected = group.permissions.filter(p => selected.includes(p.key)).length;
          const allSelected = groupSelected === group.permissions.length;
          const someSelected = groupSelected > 0 && !allSelected;

          return (
            <div key={group.label} className="border rounded-lg overflow-hidden">
              <div 
                className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => toggleGroup(group.label)}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    // @ts-ignore
                    indeterminate={someSelected}
                    onCheckedChange={(checked) => {
                      toggleAllInGroup(group, !!checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="font-semibold text-sm">{group.label}</span>
                  <span className="text-xs text-muted-foreground">({groupSelected}/{group.permissions.length})</span>
                </div>
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-2 p-3">
                  {group.permissions.map(p => (
                    <div key={p.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`perm-${p.key}`}
                        checked={selected.includes(p.key)}
                        onCheckedChange={() => onToggle(p.key)}
                        disabled={disabledKeys.includes(p.key)}
                      />
                      <Label htmlFor={`perm-${p.key}`} className="text-sm cursor-pointer">
                        {p.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function PermissionsBadges({ permissions }: { permissions: UserPermission[] }) {
  const displayPerms = permissions.filter(p => p !== 'super_admin');
  if (displayPerms.length === 0) return <span className="text-muted-foreground text-xs">لا توجد صلاحيات</span>;
  
  const labels = displayPerms.map(p => ALL_PERMISSIONS.find(ap => ap.key === p)?.label || p);
  const maxShow = 4;
  
  return (
    <div className="flex flex-wrap gap-1">
      {labels.slice(0, maxShow).map((label, i) => (
        <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{label}</span>
      ))}
      {labels.length > maxShow && (
        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">+{labels.length - maxShow}</span>
      )}
    </div>
  );
}

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
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permDialogUserId, setPermDialogUserId] = useState<string | null>(null);
  
  // Add user dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPermissions, setNewUserPermissions] = useState<UserPermission[]>([]);

  const canManageUsers = myPermissions.admin || myPermissions.users || myPermissions.super_admin;

  const openPermissionsDialog = (userId: string, currentPermissions: UserPermission[]) => {
    setPermDialogUserId(userId);
    setSelectedPermissions([...currentPermissions.filter(p => p !== 'super_admin')]);
    setPermDialogOpen(true);
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

  const savePermissions = async () => {
    if (!permDialogUserId) return;
    try {
      await updatePermissions.mutateAsync({ userId: permDialogUserId, permissions: selectedPermissions });
      toast.success('تم تحديث الصلاحيات بنجاح');
      setPermDialogOpen(false);
      setPermDialogUserId(null);
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
              <TableHead className="text-right font-bold">الصلاحيات</TableHead>
              <TableHead className="text-center font-bold">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users
              .filter(u => !u.permissions.includes('super_admin'))
              .map((u, index) => {
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
                  <TableCell>
                    <PermissionsBadges permissions={u.permissions} />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openPermissionsDialog(u.user_id, u.permissions)}
                        disabled={isCurrentUser}
                      >
                        <Shield className="w-4 h-4 ml-1" />
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

      {/* Edit Permissions Dialog */}
      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الصلاحيات</DialogTitle>
            <DialogDescription>
              حدد الصلاحيات المطلوبة لهذا المستخدم
            </DialogDescription>
          </DialogHeader>
          <PermissionsEditor
            selected={selectedPermissions}
            onToggle={togglePermission}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDialogOpen(false)}>إلغاء</Button>
            <Button onClick={savePermissions} disabled={updatePermissions.isPending}>
              {updatePermissions.isPending ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            <DialogDescription>
              قم بإدخال بيانات المستخدم الجديد وتحديد صلاحياته
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
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
              <PermissionsEditor
                selected={newUserPermissions}
                onToggle={toggleNewUserPermission}
              />
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
