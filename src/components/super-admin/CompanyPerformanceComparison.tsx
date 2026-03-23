import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCompanyPerformanceMetrics } from '@/hooks/modules/useSuperAdminServices';

interface CompanyMetrics {
  id: string;
  name: string;
  entriesCount: number;
  salesTotal: number;
  invoicesCount: number;
  customersCount: number;
  isActive: boolean;
}

export function CompanyPerformanceComparison() {
  const { data: metrics = [], isLoading } = useCompanyPerformanceMetrics();

  const maxSales = Math.max(...metrics.map((m) => m.salesTotal), 1);

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          مقارنة أداء الشركات
          <Badge variant="outline">{metrics.length} شركة</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الشركة</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">القيود</TableHead>
                  <TableHead className="text-center">المبيعات</TableHead>
                  <TableHead className="text-center">الفواتير</TableHead>
                  <TableHead className="text-center">العملاء</TableHead>
                  <TableHead className="text-center">مؤشر النشاط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m) => {
                  const activityScore = m.entriesCount + m.invoicesCount + m.customersCount;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={m.isActive ? 'default' : 'secondary'}>
                          {m.isActive ? 'نشط' : 'معطل'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">{m.entriesCount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-sm">{m.salesTotal.toLocaleString()} ر.س</span>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div
                              className="bg-primary rounded-full h-1.5 transition-all"
                              style={{ width: `${(m.salesTotal / maxSales) * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">{m.invoicesCount.toLocaleString()}</TableCell>
                      <TableCell className="text-center font-mono">{m.customersCount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {activityScore > 50 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />
                        ) : activityScore > 10 ? (
                          <Minus className="h-4 w-4 text-yellow-500 mx-auto" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
