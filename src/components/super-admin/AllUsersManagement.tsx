import { useState } from 'react';
import { Users, Shield, Check, X, Pencil, Trash2, Building2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

interface UserWithCompany {
  id: string;
  user_id: string;
  username: string;
  company_id: string;
  company_name: string;
  created_at: string;
  permissions: UserPermission[];
}

interface Company {
  id: string;
  name: string;
}

const PERMISSIONS_DISPLAY: { key: UserPermission; label: string }[] = [
  { key: 'sales', label: 'المبيعات' },
  { key: 'purchases', label: 'المشتريات' },
  { key: 'reports', label: 'التقارير' },
  { key: 'admin', label: 'الإدارة' },
  { key: 'users', label: 'المستخدمين' },
];

export function AllUsersManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithCompany | null>(null);

  // Fetch all companies
  const { data: companies = [] } = useQuery({
    queryKey: ['all-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Company[];
    },
  });

  // Fetch all users with their companies and permissions
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['all-users-super-admin'],
    queryFn: async () => {
      // First, get all profiles with company info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          username,
          company_id,
          created_at,
          companies (name)
        `)
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, permission');
      
      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithPermissions: UserWithCompany[] = profiles.map((profile: any) => {
        const userRoles = roles
          .filter((r: any) => r.user_id === profile.user_id)
          .map((r: any) => r.permission as UserPermission);
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          username: profile.username || 'بدون اسم',
          company_id: profile.company_id,
          company_name: profile.companies?.name || 'بدون شركة',
          created_at: profile.created_at,
          permissions: userRoles,
        };
      });

      return usersWithPermissions;
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const response = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-super-admin'] });
      toast.success('تم حذف المستخدم بنجاح');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف المستخدم');
    },
  });

  // Filter users
  const filteredUsers = allUsers
    // Exclude super_admin users
    .filter(u => !u.permissions.includes('super_admin'))
    .filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.company_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = filterCompany === 'all' || u.company_id === filterCompany;
      return matchesSearch && matchesCompany;
    });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          جميع المستخدمين
        </h2>
        <p className="text-muted-foreground mt-1">إدارة جميع مستخدمي النظام من جميع الشركات</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الشركة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="تصفية حسب الشركة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الشركات</SelectItem>
            {companies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
          <p className="text-2xl font-bold">{filteredUsers.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm text-muted-foreground">المدراء</p>
          <p className="text-2xl font-bold text-primary">
            {filteredUsers.filter(u => u.permissions.includes('admin')).length}
          </p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm text-muted-foreground">مستخدمي المبيعات</p>
          <p className="text-2xl font-bold text-success">
            {filteredUsers.filter(u => u.permissions.includes('sales')).length}
          </p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm text-muted-foreground">مستخدمي المشتريات</p>
          <p className="text-2xl font-bold text-blue-600">
            {filteredUsers.filter(u => u.permissions.includes('purchases')).length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">#</TableHead>
              <TableHead className="text-right font-bold">اسم المستخدم</TableHead>
              <TableHead className="text-right font-bold">الشركة</TableHead>
              <TableHead className="text-right font-bold">تاريخ التسجيل</TableHead>
              {PERMISSIONS_DISPLAY.map(p => (
                <TableHead key={p.key} className="text-center font-bold text-sm">
                  {p.label}
                </TableHead>
              ))}
              <TableHead className="text-center font-bold">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, index) => (
              <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{user.username}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{user.company_name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                {PERMISSIONS_DISPLAY.map(p => (
                  <TableCell key={p.key} className="text-center">
                    {user.permissions.includes(p.key) ? (
                      <Check className="w-5 h-5 text-success mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setUserToDelete(user);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">لا يوجد مستخدمين</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستخدم "{userToDelete?.username}"؟
              <br />
              <span className="text-muted-foreground">
                الشركة: {userToDelete?.company_name}
              </span>
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUser.mutate(userToDelete.user_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? 'جاري الحذف...' : 'حذف المستخدم'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
