import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAccounts, useAddAccount, useUpdateAccount, useDeleteAccount, useCreateDefaultAccounts } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Search, ChevronDown, ChevronRight, Folder, FolderOpen, FileText, TreesIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AccountCategory, AccountType } from '@/services/accounting';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

// Note: accountTypes labels will be localized in the component using t.*
const accountTypes: Array<{ value: AccountType; labelKey: string; color: string; bgColor: string }> = [
  { value: 'assets', labelKey: 'coa_type_assets', color: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  { value: 'liabilities', labelKey: 'coa_type_liabilities', color: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-950' },
  { value: 'equity', labelKey: 'coa_type_equity', color: 'bg-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  { value: 'revenue', labelKey: 'coa_type_revenue', color: 'bg-green-500', bgColor: 'bg-green-50 dark:bg-green-950' },
  { value: 'expenses', labelKey: 'coa_type_expenses', color: 'bg-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950' },
];

interface TreeNodeProps {
  account: AccountCategory;
  accounts: AccountCategory[];
  level: number;
  onEdit: (account: AccountCategory) => void;
  onDelete: (id: string) => void;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
}

function TreeNode({ account, accounts, level, onEdit, onDelete, expandedNodes, toggleNode }: TreeNodeProps) {
  const { t } = useLanguage();
  const children = accounts.filter(a => a.parent_id === account.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(account.id);
  const typeConfig = accountTypes.find(tc => tc.value === account.type);
  const typeLabel = typeConfig ? (t as any)[typeConfig.labelKey] : account.type;

  return (
    <div>
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 group transition-colors",
          level === 0 && "font-semibold"
        )}
        style={{ paddingRight: `${(level * 24) + 12}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0"
            onClick={() => toggleNode(account.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}
        
        {hasChildren ? (
          isExpanded ? <FolderOpen className="h-4 w-4 text-amber-500" /> : <Folder className="h-4 w-4 text-amber-500" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" />
        )}
        
        <span className="font-mono text-sm text-muted-foreground">{account.code}</span>
        <span className="flex-1">{account.name}</span>
        
        <Badge variant="outline" className={cn("text-xs", typeConfig?.bgColor)}>
          {typeLabel}
        </Badge>
        
        {account.is_system && (
          <Badge variant="secondary" className="text-xs">{t.coa_system}</Badge>
        )}
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(account)}
            disabled={account.is_system}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={account.is_system || hasChildren}
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.coa_confirm_delete}</AlertDialogTitle>
                <AlertDialogDescription>{t.coa_confirm_delete_desc}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(account.id)}>{t.delete}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="border-r border-border mr-6">
          {children
            .sort((a, b) => a.code.localeCompare(b.code))
            .map(child => (
              <TreeNode
                key={child.id}
                account={child}
                accounts={accounts}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function ChartOfAccountsPage() {
  const { t, direction } = useLanguage();
  const { data: accounts = [], isLoading } = useAccounts();
  const addAccount = useAddAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createDefaultAccounts = useCreateDefaultAccounts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
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

  // Filter accounts based on search and type
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = searchQuery === '' || 
        account.name.includes(searchQuery) || 
        account.code.includes(searchQuery) ||
        (account.description && account.description.includes(searchQuery));
      const matchesType = selectedType === 'all' || account.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, selectedType]);

  // Get root accounts (no parent)
  const rootAccounts = useMemo(() => {
    return filteredAccounts
      .filter(a => !a.parent_id || !filteredAccounts.some(p => p.id === a.parent_id))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [filteredAccounts]);

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    setExpandedNodes(new Set(accounts.map(a => a.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

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
      toast.error(t.coa_toast_fill_required);
      return;
    }

    // Check for duplicate code
    const existingAccount = accounts.find(a => a.code === formData.code && a.id !== editingAccount?.id);
    if (existingAccount) {
      toast.error(t.coa_toast_code_exists);
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          updates: formData,
        });
        toast.success(t.coa_toast_updated);
      } else {
        await addAccount.mutateAsync(formData);
        toast.success(t.coa_toast_added);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t.coa_toast_save_error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount.mutateAsync(id);
      toast.success(t.coa_toast_deleted);
    } catch (error) {
      toast.error(t.coa_toast_delete_error);
    }
  };

  const handleCreateDefaults = async () => {
    try {
      await createDefaultAccounts.mutateAsync();
      toast.success(t.coa_toast_defaults_created);
      expandAll();
    } catch (error) {
      toast.error(t.coa_toast_defaults_error);
    }
  };

  const getTypeLabel = (type: string) => {
    const tc = accountTypes.find(at => at.value === type);
    return tc ? (t as any)[tc.labelKey] : type;
  };

  const getTypeColor = (type: string) => {
    return accountTypes.find(t => t.value === type)?.color || 'bg-gray-500';
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = accounts.find(a => a.id === parentId);
    return parent ? `${parent.code} - ${parent.name}` : '-';
  };

  // Group accounts by type for table view
  const groupedAccounts = accountTypes.map(type => ({
    ...type,
    accounts: filteredAccounts.filter(a => a.type === type.value).sort((a, b) => a.code.localeCompare(b.code)),
  }));

  // Suggest next code based on parent or type
  const suggestCode = (parentId: string | null, type: AccountType) => {
    if (parentId) {
      const parent = accounts.find(a => a.id === parentId);
      if (parent) {
        const siblings = accounts.filter(a => a.parent_id === parentId);
        const maxCode = siblings.reduce((max, a) => {
          const num = parseInt(a.code);
          return num > max ? num : max;
        }, parseInt(parent.code));
        return String(maxCode + 1);
      }
    }
    
    // Suggest based on type
    const typeAccounts = accounts.filter(a => a.type === type);
    if (typeAccounts.length === 0) {
      const prefixes: Record<AccountType, string> = {
        assets: '1000',
        liabilities: '2000',
        equity: '3000',
        revenue: '4000',
        expenses: '5000',
      };
      return prefixes[type];
    }
    
    const maxCode = typeAccounts.reduce((max, a) => {
      const num = parseInt(a.code);
      return num > max ? num : max;
    }, 0);
    return String(maxCode + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={direction}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.coa_title}</h1>
          <p className="text-muted-foreground">{t.coa_subtitle} • {accounts.length} {t.acc_account}</p>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && (
            <Button variant="outline" onClick={handleCreateDefaults} disabled={createDefaultAccounts.isPending}>
              {createDefaultAccounts.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 ml-2" />
              )}
              {t.coa_create_defaults}
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                {t.coa_add_account}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingAccount ? t.coa_edit_account : t.coa_add_new}</DialogTitle>
                <DialogDescription>
                  {editingAccount ? t.coa_edit_desc : t.coa_add_desc}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t.coa_account_type}</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: AccountType) => {
                        setFormData({ ...formData, type: value });
                        if (!editingAccount && !formData.code) {
                          setFormData(prev => ({ ...prev, type: value, code: suggestCode(prev.parent_id, value) }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", type.color)} />
                              {(t as any)[type.labelKey]}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">{t.coa_account_code}</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="1001"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t.coa_account_name}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="النقدية"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">{t.coa_parent_account}</Label>
                  <Select 
                    value={formData.parent_id || 'none'} 
                    onValueChange={(value) => {
                      const newParentId = value === 'none' ? null : value;
                      setFormData({ ...formData, parent_id: newParentId });
                      if (!editingAccount) {
                        setFormData(prev => ({ ...prev, parent_id: newParentId, code: suggestCode(newParentId, prev.type) }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="بدون" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t.coa_no_parent}</SelectItem>
                      {accounts
                        .filter(a => a.id !== editingAccount?.id)
                        .sort((a, b) => a.code.localeCompare(b.code))
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <span className="font-mono text-muted-foreground ml-2">{account.code}</span>
                            {account.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t.coa_description}</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف الحساب (اختياري)"
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
                  {editingAccount ? t.coa_update_btn : t.coa_add_btn}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
              placeholder={t.coa_search_placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedType} onValueChange={(value: AccountType | 'all') => setSelectedType(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="نوع الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.coa_all_types}</SelectItem>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", type.color)} />
                      {(t as any)[type.labelKey]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'tree' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('tree')}
                title="عرض شجري"
              >
                <TreesIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
                title="عرض جدولي"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tree View */}
      {viewMode === 'tree' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TreesIcon className="w-5 h-5" />
                {t.coa_tree_title}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  {t.coa_expand_all}
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  {t.coa_collapse_all}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {rootAccounts.length === 0 ? (
              <div className="text-center py-12">
                <TreesIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.coa_no_accounts}</p>
                {accounts.length === 0 && (
                  <Button variant="outline" className="mt-4" onClick={handleCreateDefaults}>
                    {t.coa_create_defaults}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {rootAccounts.map(account => (
                  <TreeNode
                    key={account.id}
                    account={account}
                    accounts={filteredAccounts}
                    level={0}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          {groupedAccounts.map((group) => (
            group.accounts.length > 0 && (
              <Card key={group.value}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", group.color)} />
                    {(t as any)[group.labelKey]}
                    <Badge variant="secondary" className="mr-2">{group.accounts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                     <TableHead className="w-24">{t.coa_col_code}</TableHead>
                        <TableHead>{t.coa_col_name}</TableHead>
                        <TableHead>{t.coa_col_parent}</TableHead>
                        <TableHead>{t.coa_col_desc}</TableHead>
                        <TableHead className="w-24 text-center">{t.coa_col_actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono font-medium">{account.code}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {account.name}
                              {account.is_system && (
                                <Badge variant="secondary" className="text-xs">{t.coa_system}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{getParentName(account.parent_id)}</TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">{account.description || '-'}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
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
                                    disabled={account.is_system || accounts.some(a => a.parent_id === account.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t.coa_confirm_delete}</AlertDialogTitle>
                                    <AlertDialogDescription>{t.coa_confirm_delete_desc}</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(account.id)}>{t.delete}</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          ))}
          
          {filteredAccounts.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t.coa_no_match}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {accountTypes.map(type => {
          const count = accounts.filter(a => a.type === type.value).length;
          return (
            <Card key={type.value} className={cn("cursor-pointer hover:shadow-md transition-shadow", type.bgColor)}
              onClick={() => setSelectedType(type.value)}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-2 h-2 rounded-full", type.color)} />
                  <span className="text-sm font-medium">{(t as any)[type.labelKey]}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
