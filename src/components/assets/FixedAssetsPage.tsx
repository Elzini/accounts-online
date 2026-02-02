import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Calculator, FileDown, Building2, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  useFixedAssets,
  useCreateFixedAsset,
  useUpdateFixedAsset,
  useDeleteFixedAsset,
  useDisposeAsset,
  useCalculateDepreciation,
  useDepreciationEntries,
  useAssetsSummary,
  useAssetCategories,
  type FixedAsset,
  type CreateAssetInput,
} from '@/hooks/useFixedAssets';
import { useAccounts } from '@/hooks/useAccounting';
import { AccountSearchSelect } from '@/components/accounting/AccountSearchSelect';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  disposed: { label: 'تم التخلص', variant: 'destructive' },
  fully_depreciated: { label: 'مهلك بالكامل', variant: 'secondary' },
  under_maintenance: { label: 'تحت الصيانة', variant: 'outline' },
};

const DEPRECIATION_METHODS: Record<string, string> = {
  straight_line: 'القسط الثابت',
  declining_balance: 'القسط المتناقص',
  units_of_production: 'وحدات الإنتاج',
};

export function FixedAssetsPage() {
  const { data: assets = [], isLoading } = useFixedAssets();
  const { data: summary } = useAssetsSummary();
  const { data: categories = [] } = useAssetCategories();
  const { data: depreciationEntries = [] } = useDepreciationEntries();
  const { data: accounts = [] } = useAccounts();
  
  // Filter accounts by type for dropdowns (database uses plural: 'assets', 'expenses')
  const assetAccounts = useMemo(() => 
    accounts.filter(acc => acc.type === 'assets' && acc.code.startsWith('13')),
    [accounts]
  );
  
  const expenseAccounts = useMemo(() => 
    accounts.filter(acc => acc.type === 'expenses'),
    [accounts]
  );
  
  const createAsset = useCreateFixedAsset();
  const updateAsset = useUpdateFixedAsset();
  const deleteAsset = useDeleteFixedAsset();
  const disposeAsset = useDisposeAsset();
  const calculateDepreciation = useCalculateDepreciation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [depreciationDialogOpen, setDepreciationDialogOpen] = useState(false);
  const [disposeDialogOpen, setDisposeDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateAssetInput>({
    name: '',
    description: '',
    category: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: 0,
    salvage_value: 0,
    useful_life_years: 5,
    depreciation_method: 'straight_line',
    location: '',
    serial_number: '',
    notes: '',
    account_category_id: '',
    depreciation_account_id: '',
    accumulated_depreciation_account_id: '',
  });

  const [depreciationPeriod, setDepreciationPeriod] = useState({
    start: '',
    end: '',
  });

  const [disposeData, setDisposeData] = useState({
    date: new Date().toISOString().split('T')[0],
    value: 0,
    notes: '',
  });

  const openCreateDialog = () => {
    setEditingAsset(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_price: 0,
      salvage_value: 0,
      useful_life_years: 5,
      depreciation_method: 'straight_line',
      location: '',
      serial_number: '',
      notes: '',
      account_category_id: '',
      depreciation_account_id: '',
      accumulated_depreciation_account_id: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description || '',
      category: asset.category || '',
      purchase_date: asset.purchase_date,
      purchase_price: asset.purchase_price,
      salvage_value: asset.salvage_value,
      useful_life_years: asset.useful_life_years,
      depreciation_method: asset.depreciation_method,
      depreciation_rate: asset.depreciation_rate,
      location: asset.location || '',
      serial_number: asset.serial_number || '',
      notes: asset.notes || '',
      account_category_id: asset.account_category_id || '',
      depreciation_account_id: asset.depreciation_account_id || '',
      accumulated_depreciation_account_id: asset.accumulated_depreciation_account_id || '',
    });
    setDialogOpen(true);
  };

  const openDepreciationDialog = (assetId: string) => {
    setSelectedAssetId(assetId);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDepreciationPeriod({
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    });
    setDepreciationDialogOpen(true);
  };

  const openDisposeDialog = (asset: FixedAsset) => {
    setSelectedAssetId(asset.id);
    setDisposeData({
      date: new Date().toISOString().split('T')[0],
      value: asset.current_value || (asset.purchase_price - asset.accumulated_depreciation),
      notes: '',
    });
    setDisposeDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.purchase_price || !formData.useful_life_years) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      if (editingAsset) {
        await updateAsset.mutateAsync({ id: editingAsset.id, updates: formData });
      } else {
        await createAsset.mutateAsync(formData);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الأصل؟')) return;
    try {
      await deleteAsset.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const handleCalculateDepreciation = async () => {
    if (!selectedAssetId || !depreciationPeriod.start || !depreciationPeriod.end) {
      toast.error('يرجى تحديد فترة الإهلاك');
      return;
    }

    try {
      await calculateDepreciation.mutateAsync({
        assetId: selectedAssetId,
        periodStart: depreciationPeriod.start,
        periodEnd: depreciationPeriod.end,
      });
      setDepreciationDialogOpen(false);
    } catch (error) {
      console.error('Error calculating depreciation:', error);
    }
  };

  const handleDispose = async () => {
    if (!selectedAssetId) return;

    try {
      await disposeAsset.mutateAsync({
        id: selectedAssetId,
        disposalDate: disposeData.date,
        disposalValue: disposeData.value,
        notes: disposeData.notes,
      });
      setDisposeDialogOpen(false);
    } catch (error) {
      console.error('Error disposing asset:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الأصول الثابتة</h1>
          <p className="text-muted-foreground">إدارة الأصول الثابتة وجدول الإهلاك</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة أصل
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي الأصول
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAssets}</div>
              <p className="text-xs text-muted-foreground">
                {summary.activeAssets} نشط
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                قيمة الشراء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الإهلاك المتراكم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(summary.totalAccumulatedDepreciation)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                القيمة الدفترية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(summary.totalBookValue)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">الأصول</TabsTrigger>
          <TabsTrigger value="depreciation">سجل الإهلاك</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>قائمة الأصول الثابتة</CardTitle>
                  <CardDescription>جميع الأصول المسجلة في النظام</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد أصول ثابتة مسجلة</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم</TableHead>
                      <TableHead>اسم الأصل</TableHead>
                      <TableHead>التصنيف</TableHead>
                      <TableHead>تاريخ الشراء</TableHead>
                      <TableHead>قيمة الشراء</TableHead>
                      <TableHead>الإهلاك المتراكم</TableHead>
                      <TableHead>القيمة الدفترية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => {
                      const bookValue = asset.current_value || (asset.purchase_price - asset.accumulated_depreciation);
                      return (
                        <TableRow key={asset.id}>
                          <TableCell>{asset.asset_number}</TableCell>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>{asset.category || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(asset.purchase_date), 'dd/MM/yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell>{formatCurrency(asset.purchase_price)}</TableCell>
                          <TableCell className="text-destructive">
                            {formatCurrency(asset.accumulated_depreciation)}
                          </TableCell>
                          <TableCell className="text-primary font-medium">
                            {formatCurrency(bookValue)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_LABELS[asset.status]?.variant || 'default'}>
                              {STATUS_LABELS[asset.status]?.label || asset.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {asset.status === 'active' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openDepreciationDialog(asset.id)}
                                    title="حساب الإهلاك"
                                  >
                                    <Calculator className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openDisposeDialog(asset)}
                                    title="التخلص من الأصل"
                                  >
                                    <TrendingDown className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(asset)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(asset.id)}
                                className="text-destructive hover:text-destructive"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depreciation">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingDown className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>سجل الإهلاك</CardTitle>
                  <CardDescription>جميع قيود الإهلاك المسجلة</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {depreciationEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد قيود إهلاك مسجلة</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاريخ القيد</TableHead>
                      <TableHead>الأصل</TableHead>
                      <TableHead>بداية الفترة</TableHead>
                      <TableHead>نهاية الفترة</TableHead>
                      <TableHead>مبلغ الإهلاك</TableHead>
                      <TableHead>الإهلاك المتراكم</TableHead>
                      <TableHead>القيمة الدفترية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depreciationEntries.map((entry) => {
                      const asset = assets.find(a => a.id === entry.asset_id);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {format(new Date(entry.entry_date), 'dd/MM/yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {asset?.name || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.period_start), 'dd/MM/yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.period_end), 'dd/MM/yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell className="text-destructive">
                            {formatCurrency(entry.depreciation_amount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(entry.accumulated_after)}
                          </TableCell>
                          <TableCell className="text-primary font-medium">
                            {formatCurrency(entry.book_value_after)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Asset Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'تعديل الأصل' : 'إضافة أصل جديد'}</DialogTitle>
            <DialogDescription>
              أدخل بيانات الأصل الثابت
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الأصل *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: سيارة تويوتا"
                />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الشراء *</Label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>قيمة الشراء *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>القيمة التخريدية</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salvage_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, salvage_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>العمر الإنتاجي (سنوات) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.useful_life_years}
                  onChange={(e) => setFormData(prev => ({ ...prev, useful_life_years: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>طريقة الإهلاك</Label>
                <Select
                  value={formData.depreciation_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, depreciation_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة الإهلاك" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEPRECIATION_METHODS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الرقم التسلسلي</Label>
                <Input
                  value={formData.serial_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                  placeholder="اختياري"
                />
              </div>
            </div>

            {/* حسابات الأصول المحاسبية */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-sm mb-4 text-muted-foreground">الحسابات المحاسبية</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>حساب الأصل الثابت *</Label>
                  <AccountSearchSelect
                    accounts={assetAccounts.map(acc => ({ id: acc.id, code: acc.code, name: acc.name }))}
                    value={formData.account_category_id || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, account_category_id: value }))}
                    placeholder="اختر حساب الأصل (سيارات، معدات، أثاث...)"
                  />
                  <p className="text-xs text-muted-foreground">
                    الحساب الذي سيُقيد فيه الأصل (مثل: سيارات، معدات، أثاث مكتبي، أجهزة كمبيوتر)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>حساب مصروف الإهلاك</Label>
                  <AccountSearchSelect
                    accounts={expenseAccounts.map(acc => ({ id: acc.id, code: acc.code, name: acc.name }))}
                    value={formData.depreciation_account_id || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, depreciation_account_id: value }))}
                    placeholder="اختر حساب مصروف الإهلاك"
                  />
                  <p className="text-xs text-muted-foreground">
                    حساب المصروفات للإهلاك الدوري (افتراضي: 5401 - مصروف الإهلاك)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>حساب الإهلاك المتراكم</Label>
                  <AccountSearchSelect
                    accounts={assetAccounts.map(acc => ({ id: acc.id, code: acc.code, name: acc.name }))}
                    value={formData.accumulated_depreciation_account_id || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, accumulated_depreciation_account_id: value }))}
                    placeholder="اختر حساب الإهلاك المتراكم"
                  />
                  <p className="text-xs text-muted-foreground">
                    حساب مجمع الإهلاك (افتراضي: 1390 - مجمع الإهلاك)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الرقم التسلسلي</Label>
                <Input
                  value={formData.serial_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                  placeholder="اختياري"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={createAsset.isPending || updateAsset.isPending}>
              {editingAsset ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Depreciation Calculation Dialog */}
      <Dialog open={depreciationDialogOpen} onOpenChange={setDepreciationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حساب الإهلاك</DialogTitle>
            <DialogDescription>
              حدد فترة الإهلاك لحساب وتسجيل قيد الإهلاك
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>بداية الفترة</Label>
              <Input
                type="date"
                value={depreciationPeriod.start}
                onChange={(e) => setDepreciationPeriod(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>نهاية الفترة</Label>
              <Input
                type="date"
                value={depreciationPeriod.end}
                onChange={(e) => setDepreciationPeriod(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDepreciationDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCalculateDepreciation} disabled={calculateDepreciation.isPending}>
              حساب الإهلاك
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispose Asset Dialog */}
      <Dialog open={disposeDialogOpen} onOpenChange={setDisposeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>التخلص من الأصل</DialogTitle>
            <DialogDescription>
              سجل عملية التخلص من الأصل (بيع أو إتلاف)
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>تاريخ التخلص</Label>
              <Input
                type="date"
                value={disposeData.date}
                onChange={(e) => setDisposeData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>قيمة البيع/التخلص</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={disposeData.value}
                onChange={(e) => setDisposeData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={disposeData.notes}
                onChange={(e) => setDisposeData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="سبب التخلص..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposeDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleDispose} 
              disabled={disposeAsset.isPending}
              variant="destructive"
            >
              تأكيد التخلص
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
