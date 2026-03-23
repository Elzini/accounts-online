/**
 * Balance Sheet Tab Component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';
import { ExportActions } from '../ExportActions';
import { FinancialData } from '../types';

interface BalanceSheetTabProps {
  data: FinancialData;
  setData: (data: FinancialData) => void;
  editMode: boolean;
  formatNumber: (num: number) => string;
  onExport: (type: 'print' | 'excel' | 'pdf') => void;
}

export function BalanceSheetTab({ data, setData, editMode, formatNumber, onExport }: BalanceSheetTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            قائمة المركز المالي
            {data.period.to && <span className="text-sm font-normal text-muted-foreground">كما في {data.period.to}</span>}
          </CardTitle>
          <ExportActions onExport={onExport} />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">البند</TableHead>
                <TableHead className="text-left w-32">المبلغ (ر.س)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/50"><TableCell colSpan={2} className="font-bold">الموجودات</TableCell></TableRow>
              <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-medium pr-4">الموجودات المتداولة</TableCell></TableRow>
              {data.balanceSheet.currentAssets.map((asset, idx) => (
                <TableRow key={`ca-${idx}`}>
                  <TableCell className="pr-8">{asset.name}</TableCell>
                  <TableCell className="text-left font-mono">
                    {editMode ? (
                      <Input type="number" value={asset.amount} onChange={(e) => {
                        const newAssets = [...data.balanceSheet.currentAssets];
                        newAssets[idx].amount = Number(e.target.value);
                        setData({ ...data, balanceSheet: { ...data.balanceSheet, currentAssets: newAssets } });
                      }} className="w-28 text-left" />
                    ) : formatNumber(asset.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-medium pr-4">إجمالي الموجودات المتداولة</TableCell>
                <TableCell className="text-left font-mono font-bold">{formatNumber(data.balanceSheet.currentAssets.reduce((s, a) => s + a.amount, 0))}</TableCell>
              </TableRow>

              {data.balanceSheet.fixedAssets.length > 0 && (
                <>
                  <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-medium pr-4">الموجودات الغير متداولة</TableCell></TableRow>
                  {data.balanceSheet.fixedAssets.map((asset, idx) => (
                    <TableRow key={`fa-${idx}`}>
                      <TableCell className="pr-8">{asset.name}</TableCell>
                      <TableCell className="text-left font-mono">{formatNumber(asset.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="font-medium pr-4">إجمالي الموجودات الغير متداولة</TableCell>
                    <TableCell className="text-left font-mono font-bold">{formatNumber(data.balanceSheet.fixedAssets.reduce((s, a) => s + a.amount, 0))}</TableCell>
                  </TableRow>
                </>
              )}

              <TableRow className="bg-primary/10 border-t-2">
                <TableCell className="font-bold">مجموع الموجودات</TableCell>
                <TableCell className="text-left font-mono font-bold text-primary">{formatNumber(data.balanceSheet.totalAssets)}</TableCell>
              </TableRow>

              <TableRow className="bg-muted/50"><TableCell colSpan={2} className="font-bold">المطلوبات وحقوق الملكية</TableCell></TableRow>
              {data.balanceSheet.currentLiabilities.length > 0 && (
                <>
                  <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-medium pr-4">المطلوبات المتداولة</TableCell></TableRow>
                  {data.balanceSheet.currentLiabilities.map((liability, idx) => (
                    <TableRow key={`cl-${idx}`}>
                      <TableCell className="pr-8">{liability.name}</TableCell>
                      <TableCell className="text-left font-mono">{formatNumber(liability.amount)}</TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-medium pr-4">حقوق الملكية</TableCell></TableRow>
              {data.balanceSheet.equity.map((eq, idx) => (
                <TableRow key={`eq-${idx}`}>
                  <TableCell className="pr-8">{eq.name}</TableCell>
                  <TableCell className="text-left font-mono">
                    {editMode ? (
                      <Input type="number" value={eq.amount} onChange={(e) => {
                        const newEquity = [...data.balanceSheet.equity];
                        newEquity[idx].amount = Number(e.target.value);
                        setData({ ...data, balanceSheet: { ...data.balanceSheet, equity: newEquity } });
                      }} className="w-28 text-left" />
                    ) : formatNumber(eq.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-medium pr-4">مجموع حقوق الملكية</TableCell>
                <TableCell className="text-left font-mono font-bold">{formatNumber(data.balanceSheet.totalEquity)}</TableCell>
              </TableRow>
              <TableRow className="bg-primary/10 border-t-2">
                <TableCell className="font-bold">مجموع المطلوبات وحقوق الملكية</TableCell>
                <TableCell className="text-left font-mono font-bold text-primary">{formatNumber(data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
