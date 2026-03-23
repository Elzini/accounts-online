/**
 * Zakat Calculation Tab Component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Calculator, TrendingUp, Scale, Wallet } from 'lucide-react';
import { ExportActions } from '../ExportActions';
import { FinancialData } from '../types';

interface ZakatTabProps {
  data: FinancialData;
  setData: (data: FinancialData) => void;
  editMode: boolean;
  formatNumber: (num: number) => string;
  onExport: (type: 'print' | 'excel' | 'pdf') => void;
}

function EditableCell({ editMode, value, onChange, formatNumber }: { editMode: boolean; value: number; onChange: (v: number) => void; formatNumber: (n: number) => string }) {
  return editMode ? (
    <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-32 text-left" />
  ) : <>{formatNumber(value)}</>;
}

export function ZakatTab({ data, setData, editMode, formatNumber, onExport }: ZakatTabProps) {
  const zk = data.zakatCalculation;
  const updateZakat = (field: string, value: number) => setData({ ...data, zakatCalculation: { ...zk, [field]: value } });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" /> مخصص الزكاة
            {data.period.to && <span className="text-sm font-normal text-muted-foreground">للسنة المنتهية في {data.period.to}</span>}
          </CardTitle>
          <ExportActions onExport={onExport} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* احتساب المخصص */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-primary border-b pb-2"><Calculator className="w-5 h-5" /> أ- احتساب المخصص</h3>
          <Table>
            <TableBody>
              <TableRow><TableCell>الربح (الخسارة) قبل الزكاة</TableCell><TableCell className="text-left font-mono"><EditableCell editMode={editMode} value={zk.profitBeforeZakat} onChange={(v) => updateZakat('profitBeforeZakat', v)} formatNumber={formatNumber} /></TableCell></TableRow>
              <TableRow><TableCell>تعديلات على صافي الدخل</TableCell><TableCell className="text-left font-mono">{formatNumber(zk.adjustmentsOnNetIncome)}</TableCell></TableRow>
              <TableRow className="bg-muted/30"><TableCell className="font-medium">صافي الربح المعدل</TableCell><TableCell className="text-left font-mono font-medium">{formatNumber(zk.adjustedNetProfit)}</TableCell></TableRow>
              <TableRow className="bg-primary/10"><TableCell className="font-bold">الزكاة الشرعية طبقاً لصافي الربح المعدل</TableCell><TableCell className="text-left font-mono font-bold">{formatNumber(zk.zakatOnAdjustedProfit)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>

        {/* الوعاء الزكوي */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-primary border-b pb-2"><TrendingUp className="w-5 h-5" /> الوعاء الزكوي</h3>
            <Table>
              <TableBody>
                <TableRow><TableCell>رأس المال</TableCell><TableCell className="text-left font-mono"><EditableCell editMode={editMode} value={zk.capital} onChange={(v) => updateZakat('capital', v)} formatNumber={formatNumber} /></TableCell></TableRow>
                <TableRow><TableCell>جاري الشركاء</TableCell><TableCell className="text-left font-mono"><EditableCell editMode={editMode} value={zk.partnersCurrentAccount} onChange={(v) => updateZakat('partnersCurrentAccount', v)} formatNumber={formatNumber} /></TableCell></TableRow>
                <TableRow><TableCell>احتياطي نظامي رصيد مدور</TableCell><TableCell className="text-left font-mono"><EditableCell editMode={editMode} value={zk.statutoryReserve} onChange={(v) => updateZakat('statutoryReserve', v)} formatNumber={formatNumber} /></TableCell></TableRow>
                <TableRow><TableCell>التزامات منافع موظفين مدورة</TableCell><TableCell className="text-left font-mono">{formatNumber(zk.employeeBenefitsLiabilities)}</TableCell></TableRow>
                <TableRow className="bg-muted/50"><TableCell className="font-bold">المجموع</TableCell><TableCell className="text-left font-mono font-bold">{formatNumber(zk.zakatBaseTotal)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-destructive border-b pb-2"><Scale className="w-5 h-5" /> ينزل</h3>
            <Table>
              <TableBody>
                <TableRow><TableCell>العقارات والآلات والمعدات، صافي</TableCell><TableCell className="text-left font-mono text-destructive"><EditableCell editMode={editMode} value={zk.fixedAssets} onChange={(v) => updateZakat('fixedAssets', v)} formatNumber={(n) => `(${formatNumber(n)})`} /></TableCell></TableRow>
                <TableRow><TableCell>موجودات غير ملموسة، صافي</TableCell><TableCell className="text-left font-mono text-destructive"><EditableCell editMode={editMode} value={zk.intangibleAssets} onChange={(v) => updateZakat('intangibleAssets', v)} formatNumber={(n) => `(${formatNumber(n)})`} /></TableCell></TableRow>
                <TableRow className="bg-muted/50"><TableCell className="font-bold">وعاء الزكاة</TableCell><TableCell className="text-left font-mono font-bold">{formatNumber(zk.zakatBase)}</TableCell></TableRow>
                <TableRow><TableCell>مخصص الزكاة الشرعية طبقاً للوعاء</TableCell><TableCell className="text-left font-mono">{formatNumber(zk.zakatOnBase)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* إجمالي الزكاة */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <Table>
            <TableBody>
              <TableRow className="bg-primary/10">
                <TableCell className="font-bold text-lg">إجمالي مخصص الزكاة التقريبي</TableCell>
                <TableCell className="text-left font-mono font-bold text-lg text-primary">
                  <EditableCell editMode={editMode} value={zk.totalZakat} onChange={(v) => updateZakat('totalZakat', v)} formatNumber={(n) => `${formatNumber(n)} ر.س`} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* حركة مخصص الزكاة */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-muted-foreground border-b pb-2"><Wallet className="w-5 h-5" /> ب- حركة مخصص الزكاة الشرعية</h3>
          <Table>
            <TableBody>
              <TableRow><TableCell>رصيد أول السنة</TableCell><TableCell className="text-left font-mono"><EditableCell editMode={editMode} value={zk.openingBalance} onChange={(v) => updateZakat('openingBalance', v)} formatNumber={formatNumber} /></TableCell></TableRow>
              <TableRow><TableCell>مخصص الزكاة المكون</TableCell><TableCell className="text-left font-mono">{formatNumber(zk.provisionAdded)}</TableCell></TableRow>
              <TableRow><TableCell>المسدد خلال السنة</TableCell><TableCell className="text-left font-mono text-destructive"><EditableCell editMode={editMode} value={zk.paidDuringYear} onChange={(v) => updateZakat('paidDuringYear', v)} formatNumber={(n) => `(${formatNumber(n)})`} /></TableCell></TableRow>
              <TableRow className="bg-muted/50"><TableCell className="font-bold">الرصيد الختامي (التزامات الزكاة)</TableCell><TableCell className="text-left font-mono font-bold">{formatNumber(zk.closingBalance)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p>تم إعداد مخصص الزكاة بشكل تقديري. في حالة وجود فروقات ما بين مخصص الزكاة والربط النهائي سيتم إثباتها كتغيرات في التقديرات المحاسبية.</p>
        </div>
      </CardContent>
    </Card>
  );
}
