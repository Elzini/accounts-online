import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAccounts, useAddAccount, useUpdateAccount, useDeleteAccount, useCreateDefaultAccounts } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, FolderTree, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AccountCategory, AccountType } from '@/services/accounting';

const accountTypes: Array<{ value: AccountType; label: string; color: string }> = [
  { value: 'assets', label: 'أصول', color: 'bg-blue-500' },
  { value: 'liabilities', label: 'خصوم', color: 'bg-red-500' },
  { value: 'equity', label: 'حقوق الملكية', color: 'bg-purple-500' },
  { value: 'revenue', label: 'إيرادات', color: 'bg-green-500' },
  { value: 'expenses', label: 'مصروفات', color: 'bg-orange-500' },
];

export function ChartOfAccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const addAccount = useAddAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createDefaultAccounts = useCreateDefaultAccounts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountCategory | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    type: AccountType;
    description: string;
    parent_id: string | null;
    is_system: boolean;
  }>({
    code: '',
    name: '',
    type: 'assets',
    description: '',
    parent_id: null,
    is_system: false,
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'assets',
      description: '',
      parent_id: null,
      is_system: false,
    });
    setEditingAccount(null);
  };

  const handleEdit = (account: AccountCategory) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      description: account.description || '',
      parent_id: account.parent_id,
      is_system: account.is_system,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          updates: formData,
        });
        toast.success('تم تحديث الحساب بنجاح');
      } else {
        await addAccount.mutateAsync(formData);
        toast.success('تم إضافة الحساب بنجاح');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الحساب');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount.mutateAsync(id);
      toast.success('تم حذف الحساب بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الحساب');
    }
  };

  const handleCreateDefaults = async () => {
    try {
      await createDefaultAccounts.mutateAsync();
      toast.success('تم إنشاء الحسابات الافتراضية بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الحسابات');
    }
  };

  const getTypeLabel = (type: string) => {
    return accountTypes.find(t => t.value === type)?.label || type;
  };

  const getTypeColor = (type: string) => {
    return accountTypes.find(t => t.value === type)?.color || 'bg-gray-500';
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = accounts.find(a => a.id === parentId);
    return parent ? parent.name : '-';
  };

  // Group accounts by type
  const groupedAccounts = accountTypes.map(type => ({
    ...type,
    accounts: accounts.filter(a => a.type === type.value),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">شجرة الحسابات</h1>
          <p className="text-muted-foreground">إدارة دليل الحسابات للشركة</p>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && (
            <Button variant="outline" onClick={handleCreateDefaults} disabled={createDefaultAccounts.isPending}>
              {createDefaultAccounts.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 ml-2" />
              )}
              إنشاء حسابات افتراضية
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                إضافة حساب
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'تعديل الحساب' : 'إضافة حساب جديد'}</DialogTitle>
                <DialogDescription>
                  {editingAccount ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد إلى شجرة الحسابات'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">رمز الحساب *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="1001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">نوع الحساب *</Label>
                    <Select value={formData.type} onValueChange={(value: AccountType) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الحساب *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="النقدية"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">الحساب الأب</Label>
                  <Select 
                    value={formData.parent_id || 'none'} 
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="بدون" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون</SelectItem>
                      {accounts
                        .filter(a => a.id !== editingAccount?.id)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف الحساب"
                  />
                </div>
                <Button 
                  onClick={handleSubmit} 
                  className="w-full"
                  disabled={addAccount.isPending || updateAccount.isPending}
                >
                  {(addAccount.isPending || updateAccount.isPending) ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : null}
                  {editingAccount ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {groupedAccounts.map((group) => (
        <Card key={group.value}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${group.color}`} />
              {group.label}
              <Badge variant="secondary" className="mr-2">{group.accounts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group.accounts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا توجد حسابات</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">الرمز</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الحساب الأب</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead className="w-20">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono font-medium">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{getParentName(account.parent_id)}</TableCell>
                      <TableCell className="text-muted-foreground">{account.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(account)}
                            disabled={account.is_system}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={account.is_system}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(account.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
