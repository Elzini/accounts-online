import { useState } from 'react';
import { Users, Shield, Check, X, Save, UserPlus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ActivePage } from '@/types';
import { useUsers, useUpdateUserPermissions, useUpdateUsername, useCreateUser, useDeleteUser } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

interface UsersManagementProps { setActivePage: (page: ActivePage) => void; }
interface PermissionGroup { label: string; permissions: { key: UserPermission; label: string }[]; }

function usePermissionGroups(): PermissionGroup[] {
  const { t } = useLanguage();
  return [
    { label: t.perm_sales_purchases, permissions: [
      { key: 'sales', label: t.perm_sales }, { key: 'purchases', label: t.perm_purchases }, { key: 'customers', label: t.perm_customers },
      { key: 'suppliers', label: t.perm_suppliers }, { key: 'sales_invoices', label: t.perm_sales_invoices }, { key: 'purchase_invoices', label: t.perm_purchase_invoices },
      { key: 'quotations', label: t.perm_quotations }, { key: 'partner_dealerships', label: t.perm_partner_dealerships }, { key: 'car_transfers', label: t.perm_car_transfers },
      { key: 'edit_sales_invoice', label: t.perm_edit_sales_invoice },
    ]},
    { label: t.perm_accounting, permissions: [
      { key: 'financial_accounting', label: t.perm_financial_accounting }, { key: 'chart_of_accounts', label: t.perm_chart_of_accounts },
      { key: 'journal_entries', label: t.perm_journal_entries }, { key: 'general_ledger', label: t.perm_general_ledger },
      { key: 'account_statement', label: t.perm_account_statement }, { key: 'fiscal_years', label: t.perm_fiscal_years },
      { key: 'tax_settings', label: t.perm_tax_settings }, { key: 'cost_centers', label: t.perm_cost_centers },
      { key: 'fixed_assets', label: t.perm_fixed_assets }, { key: 'vouchers', label: t.perm_vouchers },
      { key: 'expenses', label: t.perm_expenses }, { key: 'prepaid_expenses', label: t.perm_prepaid_expenses },
      { key: 'installments', label: t.perm_installments }, { key: 'checks', label: t.perm_checks },
    ]},
    { label: t.perm_reports_statements, permissions: [
      { key: 'reports', label: t.perm_reports }, { key: 'all_reports', label: t.perm_all_reports },
      { key: 'financial_reports', label: t.perm_financial_reports }, { key: 'financial_statements', label: t.perm_financial_statements },
      { key: 'trial_balance', label: t.perm_trial_balance }, { key: 'vat_return', label: t.perm_vat_return },
      { key: 'zakat_reports', label: t.perm_zakat_reports }, { key: 'aging_report', label: t.perm_aging_report },
      { key: 'financial_kpis', label: t.perm_financial_kpis }, { key: 'budgets', label: t.perm_budgets },
    ]},
    { label: t.perm_banking_finance, permissions: [
      { key: 'banking', label: t.perm_banking }, { key: 'financing', label: t.perm_financing }, { key: 'currencies', label: t.perm_currencies },
    ]},
    { label: t.perm_hr, permissions: [
      { key: 'employees', label: t.perm_employees }, { key: 'payroll', label: t.perm_payroll },
      { key: 'attendance', label: t.perm_attendance }, { key: 'leaves', label: t.perm_leaves },
    ]},
    { label: t.perm_warehouses_manufacturing, permissions: [
      { key: 'warehouses', label: t.perm_warehouses }, { key: 'manufacturing', label: t.perm_manufacturing },
    ]},
    { label: t.perm_admin_system, permissions: [
      { key: 'admin', label: t.perm_admin }, { key: 'users', label: t.perm_users }, { key: 'control_center', label: t.perm_control_center },
      { key: 'accounting_audit', label: t.perm_accounting_audit }, { key: 'app_settings', label: t.perm_app_settings },
      { key: 'theme_settings', label: t.perm_theme_settings }, { key: 'branches', label: t.perm_branches },
      { key: 'approvals', label: t.perm_approvals }, { key: 'tasks', label: t.perm_tasks },
      { key: 'custody', label: t.perm_custody }, { key: 'integrations', label: t.perm_integrations },
      { key: 'medad_import', label: t.perm_medad_import },
    ]},
  ];
}

function PermissionsEditor({ selected, onToggle, disabledKeys = [] }: { selected: UserPermission[]; onToggle: (key: UserPermission) => void; disabledKeys?: UserPermission[] }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const groups = usePermissionGroups();
  const toggleGroup = (label: string) => { setCollapsed(prev => ({ ...prev, [label]: !prev[label] })); };
  const toggleAllInGroup = (group: PermissionGroup, checked: boolean) => {
    group.permissions.forEach(p => { if (disabledKeys.includes(p.key)) return; const isSelected = selected.includes(p.key); if (checked && !isSelected) onToggle(p.key); if (!checked && isSelected) onToggle(p.key); });
  };
  return (
    <ScrollArea className="max-h-[400px]">
      <div className="space-y-3 p-1">
        {groups.map(group => {
          const isCollapsed = collapsed[group.label];
          const groupSelected = group.permissions.filter(p => selected.includes(p.key)).length;
          const allSelected = groupSelected === group.permissions.length;
          const someSelected = groupSelected > 0 && !allSelected;
          return (
            <div key={group.label} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => toggleGroup(group.label)}>
                <div className="flex items-center gap-2">
                  <Checkbox checked={allSelected} // @ts-ignore
                    indeterminate={someSelected} onCheckedChange={(checked) => { toggleAllInGroup(group, !!checked); }} onClick={(e) => e.stopPropagation()} />
                  <span className="font-semibold text-sm">{group.label}</span>
                  <span className="text-xs text-muted-foreground">({groupSelected}/{group.permissions.length})</span>
                </div>
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-2 p-3">
                  {group.permissions.map(p => (
                    <div key={p.key} className="flex items-center gap-2">
                      <Checkbox id={`perm-${p.key}`} checked={selected.includes(p.key)} onCheckedChange={() => onToggle(p.key)} disabled={disabledKeys.includes(p.key)} />
                      <Label htmlFor={`perm-${p.key}`} className="text-sm cursor-pointer">{p.label}</Label>
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
  const groups = usePermissionGroups();
  const allPerms = groups.flatMap(g => g.permissions);
  const displayPerms = permissions.filter(p => p !== 'super_admin');
  const { t } = useLanguage();
  if (displayPerms.length === 0) return <span className="text-muted-foreground text-xs">{t.users_no_permissions}</span>;
  const labels = displayPerms.map(p => allPerms.find(ap => ap.key === p)?.label || p);
  const maxShow = 4;
  return (
    <div className="flex flex-wrap gap-1">
      {labels.slice(0, maxShow).map((label, i) => <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{label}</span>)}
      {labels.length > maxShow && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">+{labels.length - maxShow}</span>}
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
  const { t, language } = useLanguage();
  
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<UserPermission[]>([]);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permDialogUserId, setPermDialogUserId] = useState<string | null>(null);
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

  const togglePermission = (permission: UserPermission) => { setSelectedPermissions(prev => prev.includes(permission) ? prev.filter(p => p !== permission) : [...prev, permission]); };
  const toggleNewUserPermission = (permission: UserPermission) => { setNewUserPermissions(prev => prev.includes(permission) ? prev.filter(p => p !== permission) : [...prev, permission]); };

  const savePermissions = async () => {
    if (!permDialogUserId) return;
    try { await updatePermissions.mutateAsync({ userId: permDialogUserId, permissions: selectedPermissions }); toast.success(t.users_permissions_updated); setPermDialogOpen(false); setPermDialogUserId(null); }
    catch (error) { toast.error(t.users_permissions_error); }
  };

  const startEditingUsername = (userId: string, currentUsername: string) => { setEditingUsername(userId); setNewUsername(currentUsername); };
  const saveUsername = async (userId: string) => {
    if (!newUsername.trim()) { toast.error(t.users_username_required); return; }
    try { await updateUsername.mutateAsync({ userId, username: newUsername.trim() }); toast.success(t.users_username_updated); setEditingUsername(null); }
    catch (error) { toast.error(t.users_username_error); }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserName.trim()) { toast.error(t.users_all_required); return; }
    if (newUserPassword.length < 6) { toast.error(t.users_password_min); return; }
    try { await createUser.mutateAsync({ email: newUserEmail.trim(), password: newUserPassword, username: newUserName.trim(), permissions: newUserPermissions }); toast.success(t.users_added); setAddDialogOpen(false); resetAddForm(); }
    catch (error: any) { toast.error(error.message || t.users_add_error); }
  };

  const resetAddForm = () => { setNewUserEmail(''); setNewUserPassword(''); setNewUserName(''); setNewUserPermissions([]); };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try { await deleteUserMutation.mutateAsync(userToDelete.id); toast.success(t.users_deleted); setDeleteDialogOpen(false); setUserToDelete(null); }
    catch (error) { toast.error(t.users_delete_error); }
  };

  const formatDate = (date: string) => new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US').format(new Date(date));

  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">{t.users_unauthorized}</h2>
        <p className="text-muted-foreground">{t.users_unauthorized_desc}</p>
        <Button onClick={() => setActivePage('dashboard')} className="mt-4">{t.users_go_home}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.users_title}</h1>
          <p className="text-muted-foreground mt-1">{t.users_subtitle}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gradient-primary hover:opacity-90">
          <UserPlus className="w-5 h-5 ml-2" />
          {t.users_add}
        </Button>
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">#</TableHead>
              <TableHead className="text-right font-bold">{t.users_username}</TableHead>
              <TableHead className="text-right font-bold">{t.users_register_date}</TableHead>
              <TableHead className="text-right font-bold">{t.users_permissions}</TableHead>
              <TableHead className="text-center font-bold">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.filter(u => !u.permissions.includes('super_admin')).map((u, index) => {
              const isEditingName = editingUsername === u.user_id;
              const isCurrentUser = u.user_id === user?.id;
              return (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-semibold">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-32 h-8" />
                        <Button size="sm" onClick={() => saveUsername(u.user_id)} disabled={updateUsername.isPending} className="h-8 w-8 p-0"><Save className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingUsername(null)} className="h-8 w-8 p-0"><X className="w-3 h-3" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        {u.username}
                        {isCurrentUser && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{language === 'ar' ? 'أنت' : 'You'}</span>}
                        {!isCurrentUser && <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEditingUsername(u.user_id, u.username)}><Pencil className="w-3 h-3" /></Button>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(u.created_at)}</TableCell>
                  <TableCell><PermissionsBadges permissions={u.permissions} /></TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" onClick={() => openPermissionsDialog(u.user_id, u.permissions)} disabled={isCurrentUser}>
                        <Shield className="w-4 h-4 ml-1" />{t.users_edit_permissions}
                      </Button>
                      {!isCurrentUser && (
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setUserToDelete({ id: u.user_id, username: u.username }); setDeleteDialogOpen(true); }}>
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
        {users.length === 0 && <div className="p-12 text-center"><p className="text-muted-foreground">{t.no_customers_yet}</p></div>}
      </div>

      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{t.users_edit_permissions}</DialogTitle>
            <DialogDescription>{t.users_subtitle}</DialogDescription>
          </DialogHeader>
          <PermissionsEditor selected={selectedPermissions} onToggle={togglePermission} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={savePermissions} disabled={updatePermissions.isPending}>{updatePermissions.isPending ? t.settings_saving : t.users_save_permissions}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{t.users_add_title}</DialogTitle>
            <DialogDescription>{t.users_add_desc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label htmlFor="username">{t.users_username}</Label><Input id="username" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="email">{t.users_email}</Label><Input id="email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} dir="ltr" /></div>
            <div className="grid gap-2"><Label htmlFor="password">{t.users_password}</Label><Input id="password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} dir="ltr" /></div>
            <div className="grid gap-2"><Label>{t.users_permissions}</Label><PermissionsEditor selected={newUserPermissions} onToggle={toggleNewUserPermission} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetAddForm(); }}>{t.cancel}</Button>
            <Button onClick={handleAddUser} disabled={createUser.isPending}>{createUser.isPending ? t.settings_saving : t.users_add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.users_delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{t.users_delete_desc.replace('{username}', userToDelete?.username || '')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteUserMutation.isPending ? t.settings_deleting : t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
