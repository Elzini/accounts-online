import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useREDashboardStats, useREProjects, useREUnits, useREProgressBillings } from '@/hooks/useRealEstate';
import { useRECRMStats } from '@/hooks/useRealEstateCRM';
import { useProjectCostAllocations } from '@/hooks/useRealEstateAccounting';
import { BarChart3, TrendingUp, DollarSign, Building2, Users, Percent, PieChart, Target, Calculator } from 'lucide-react';

export function REReportsPage() {
  const { data: stats } = useREDashboardStats();
  const { data: crmStats } = useRECRMStats();
  const { data: projects } = useREProjects();
  const { data: units } = useREUnits();
  const { data: billings } = useREProgressBillings();
  const [selectedCostProject, setSelectedCostProject] = useState<string>('all');

  const fmt = (n: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }).format(n);
  const fmtNum = (n: number) => new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(n);

  // Per-unit cost allocation calculation
  const costAllocations = useProjectCostAllocations(projects, units);
  const filteredAllocations = selectedCostProject === 'all'
    ? costAllocations
    : costAllocations.filter(a => a.projectId === selectedCostProject);

  // Project profitability — uses stored unit cost (proportional allocation from completeUnitSale)
  const projectProfitability = (projects || []).map((p: any) => {
    const allProjectUnits = (units || []).filter((u: any) => u.project_id === p.id);
    const pUnits = allProjectUnits.filter((u: any) => u.status === 'sold');
    const totalRevenue = pUnits.reduce((s: number, u: any) => s + Number(u.sale_price || 0), 0);
    // Use unit-level cost (COGS transferred) — not total_spent to avoid double counting
    const totalCOGS = pUnits.reduce((s: number, u: any) => s + Number(u.cost || 0), 0);
    const profit = totalRevenue - totalCOGS;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const totalProjectCost = Number(p.total_spent || 0);
    const unsoldCostRemaining = totalProjectCost - totalCOGS;
    return { ...p, totalRevenue, totalCOGS, profit, margin, soldCount: pUnits.length, totalUnits: allProjectUnits.length, totalProjectCost, unsoldCostRemaining };
  });

  // Cash flow summary
  const totalIncome = projectProfitability.reduce((s, p) => s + p.totalRevenue, 0);
  const totalExpenses = projectProfitability.reduce((s, p) => s + p.totalCOGS, 0);
  const pendingBillingAmount = (billings || []).filter((b: any) => b.status === 'submitted').reduce((s: number, b: any) => s + Number(b.net_amount || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">التقارير والتحليلات العقارية</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-xl font-bold">{fmt(totalIncome)}</div>
            <div className="text-xs text-muted-foreground">إجمالي الإيرادات</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <div className="text-xl font-bold">{fmt(totalExpenses)}</div>
            <div className="text-xs text-muted-foreground">إجمالي المصروفات</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-xl font-bold">{fmt(totalIncome - totalExpenses)}</div>
            <div className="text-xs text-muted-foreground">صافي الربح</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <div className="text-xl font-bold">{fmt(pendingBillingAmount)}</div>
            <div className="text-xs text-muted-foreground">مستخلصات معلقة</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profitability">
        <TabsList>
          <TabsTrigger value="profitability">ربحية المشاريع</TabsTrigger>
          <TabsTrigger value="units">تقرير الوحدات</TabsTrigger>
          <TabsTrigger value="cashflow">التدفقات النقدية</TabsTrigger>
          <TabsTrigger value="crm">تقرير المبيعات</TabsTrigger>
        </TabsList>

        <TabsContent value="profitability">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" />تحليل ربحية المشاريع</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>المشروع</TableHead><TableHead>الوحدات المباعة</TableHead><TableHead>الإيرادات</TableHead>
                  <TableHead>التكاليف</TableHead><TableHead>الربح</TableHead><TableHead>هامش الربح</TableHead><TableHead>نسبة الإنجاز</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {projectProfitability.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.soldCount}</TableCell>
                      <TableCell className="text-green-600">{fmt(p.totalRevenue)}</TableCell>
                      <TableCell className="text-red-600">{fmt(p.totalCOGS)}</TableCell>
                      <TableCell className={p.profit >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{fmt(p.profit)}</TableCell>
                      <TableCell><Badge variant={p.margin >= 20 ? 'default' : 'secondary'}>{p.margin.toFixed(1)}%</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${p.progress_percentage || 0}%` }} /></div>
                          <span className="text-xs">{p.progress_percentage || 0}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per-Unit Cost Allocation & Profitability Tab */}
        <TabsContent value="unit-cost">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" />توزيع التكاليف وربحية الوحدات</CardTitle>
                <Select value={selectedCostProject} onValueChange={setSelectedCostProject}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="كل المشاريع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المشاريع</SelectItem>
                    {(projects || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Cards */}
              {selectedCostProject !== 'all' && filteredAllocations.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{fmt(filteredAllocations[0]?.totalProjectCost || 0)}</div>
                    <div className="text-xs text-muted-foreground">إجمالي تكلفة المشروع</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{fmtNum(filteredAllocations[0]?.totalProjectArea || 0)} م²</div>
                    <div className="text-xs text-muted-foreground">إجمالي المساحة</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <div className="text-lg font-bold">{fmt(filteredAllocations[0]?.costPerSqm || 0)}</div>
                    <div className="text-xs text-muted-foreground">تكلفة المتر المربع</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{filteredAllocations.length}</div>
                    <div className="text-xs text-muted-foreground">عدد الوحدات</div>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader><TableRow>
                  <TableHead>رقم الوحدة</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>المساحة (م²)</TableHead>
                  <TableHead>نسبة المساحة</TableHead>
                  <TableHead>تكلفة/م²</TableHead>
                  <TableHead>التكلفة المخصصة</TableHead>
                  <TableHead>سعر البيع</TableHead>
                  <TableHead>الربح/الخسارة</TableHead>
                  <TableHead>هامش الربح</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredAllocations.map((a) => (
                    <TableRow key={a.unitId}>
                      <TableCell className="font-medium">{a.unitNumber}</TableCell>
                      <TableCell>{a.projectName}</TableCell>
                      <TableCell>{fmtNum(a.unitArea)}</TableCell>
                      <TableCell>{fmtNum(a.areaPercentage)}%</TableCell>
                      <TableCell>{fmt(a.costPerSqm)}</TableCell>
                      <TableCell className="font-semibold">{fmt(a.allocatedCost)}</TableCell>
                      <TableCell>{a.salePrice > 0 ? fmt(a.salePrice) : <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className={a.profit >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {a.salePrice > 0 ? fmt(a.profit) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {a.salePrice > 0 ? (
                          <Badge variant={a.profitMargin >= 20 ? 'default' : a.profitMargin >= 0 ? 'secondary' : 'destructive'}>
                            {fmtNum(a.profitMargin)}%
                          </Badge>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={a.status === 'sold' ? 'bg-blue-100 text-blue-800' : a.status === 'reserved' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                          {a.status === 'sold' ? 'مباعة' : a.status === 'reserved' ? 'محجوزة' : 'متاحة'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAllocations.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">لا توجد وحدات لعرض التوزيع</TableCell></TableRow>
                  )}
                  {/* Totals Row */}
                  {filteredAllocations.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3}>الإجمالي</TableCell>
                      <TableCell>100%</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{fmt(filteredAllocations.reduce((s, a) => s + a.allocatedCost, 0))}</TableCell>
                      <TableCell>{fmt(filteredAllocations.filter(a => a.salePrice > 0).reduce((s, a) => s + a.salePrice, 0))}</TableCell>
                      <TableCell className={filteredAllocations.reduce((s, a) => s + (a.salePrice > 0 ? a.profit : 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {fmt(filteredAllocations.filter(a => a.salePrice > 0).reduce((s, a) => s + a.profit, 0))}
                      </TableCell>
                      <TableCell colSpan={2}>-</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />تقرير حالة الوحدات</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg"><div className="text-2xl font-bold">{stats?.totalUnits || 0}</div><div className="text-xs text-muted-foreground">إجمالي الوحدات</div></div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg"><div className="text-2xl font-bold text-green-600">{stats?.availableUnits || 0}</div><div className="text-xs text-muted-foreground">متاحة</div></div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg"><div className="text-2xl font-bold text-yellow-600">{stats?.reservedUnits || 0}</div><div className="text-xs text-muted-foreground">محجوزة</div></div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg"><div className="text-2xl font-bold text-blue-600">{stats?.soldUnits || 0}</div><div className="text-xs text-muted-foreground">مباعة</div></div>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>رقم الوحدة</TableHead><TableHead>المشروع</TableHead><TableHead>النوع</TableHead>
                  <TableHead>المساحة</TableHead><TableHead>السعر</TableHead><TableHead>التكلفة المخصصة</TableHead><TableHead>الحالة</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(units || []).slice(0, 50).map((u: any) => {
                    const alloc = costAllocations.find(a => a.unitId === u.id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.unit_number}</TableCell>
                        <TableCell>{u.re_projects?.name || '-'}</TableCell>
                        <TableCell>{u.unit_type === 'apartment' ? 'شقة' : u.unit_type === 'villa' ? 'فيلا' : u.unit_type === 'land' ? 'أرض' : u.unit_type}</TableCell>
                        <TableCell>{u.area} م²</TableCell>
                        <TableCell>{fmt(u.price || 0)}</TableCell>
                        <TableCell className="font-semibold">{alloc ? fmt(alloc.allocatedCost) : '-'}</TableCell>
                        <TableCell><Badge className={u.status === 'available' ? 'bg-green-100 text-green-800' : u.status === 'sold' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>{u.status === 'available' ? 'متاحة' : u.status === 'sold' ? 'مباعة' : 'محجوزة'}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />ملخص التدفقات النقدية</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="font-medium">إيرادات المبيعات</span>
                  <span className="text-green-600 font-bold">{fmt(totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <span className="font-medium">مصروفات المشاريع</span>
                  <span className="text-red-600 font-bold">{fmt(stats?.totalSpent || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                  <span className="font-medium">مستخلصات مقاولين معلقة</span>
                  <span className="text-orange-600 font-bold">{fmt(pendingBillingAmount)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                  <span className="font-bold text-lg">صافي التدفق النقدي</span>
                  <span className={`font-bold text-lg ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(totalIncome - totalExpenses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crm">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />تقرير أداء المبيعات</CardTitle></CardHeader>
            <CardContent>
              {crmStats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg"><div className="text-2xl font-bold">{crmStats.totalLeads}</div><div className="text-xs text-muted-foreground">إجمالي العملاء المحتملين</div></div>
                    <div className="text-center p-4 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-600">{crmStats.convertedLeads}</div><div className="text-xs text-muted-foreground">تم تحويلهم</div></div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg"><div className="text-2xl font-bold text-primary">{crmStats.conversionRate}%</div><div className="text-xs text-muted-foreground">معدل التحويل</div></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">مصادر العملاء</h4>
                    <div className="space-y-2">
                      {Object.entries(crmStats.sourceBreakdown).map(([source, count]) => (
                        <div key={source} className="flex justify-between items-center">
                          <span>{source === 'walk_in' ? 'زيارة' : source === 'phone' ? 'هاتف' : source === 'website' ? 'موقع' : source === 'social_media' ? 'تواصل اجتماعي' : source === 'referral' ? 'توصية' : source}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${((count as number) / crmStats.totalLeads) * 100}%` }} /></div>
                            <span className="text-sm font-medium">{count as number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
