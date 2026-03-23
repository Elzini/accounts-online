/**
 * ZakatReportsPage - Zakat Base Tab
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { ExportActions } from './ExportActions';
import type { ZakatBaseStatement } from '@/services/zakatReports';

interface ZakatBaseTabProps {
  data: ZakatBaseStatement | null | undefined;
  fiscalYear: string;
  onFiscalYearChange: (year: string) => void;
  currentYear: number;
  onExport: (type: 'print' | 'excel' | 'pdf') => void;
}

export function ZakatBaseTab({ data, fiscalYear, onFiscalYearChange, currentYear, onExport }: ZakatBaseTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              قائمة الوعاء الزكوي
            </CardTitle>
            <CardDescription>احتساب الوعاء الزكوي والزكاة المستحقة حسب متطلبات هيئة الزكاة والضريبة والجمارك</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportActions onExport={onExport} />
            <Select value={fiscalYear} onValueChange={onFiscalYearChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="السنة" />
              </SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data ? (
          <>
            {/* Company Info */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="grid gap-2 md:grid-cols-3">
                  <div>
                    <span className="text-sm text-muted-foreground">اسم الشركة:</span>
                    <p className="font-medium">{data.companyInfo.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">الرقم الضريبي:</span>
                    <p className="font-medium">{data.companyInfo.taxNumber || 'غير محدد'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">السجل التجاري:</span>
                    <p className="font-medium">{data.companyInfo.commercialRegister || 'غير محدد'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sources & Deductions */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-primary">مصادر الأموال الخاضعة للزكاة</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {[
                        ['رأس المال المدفوع', data.zakatableSources.paidUpCapital],
                        ['الاحتياطيات', data.zakatableSources.reserves],
                        ['الأرباح المحتجزة', data.zakatableSources.retainedEarnings],
                        ['صافي ربح السنة', data.zakatableSources.netIncomeForYear],
                        ['المخصصات', data.zakatableSources.provisions],
                        ['القروض طويلة الأجل', data.zakatableSources.longTermLoans],
                      ].map(([label, value], idx) => (
                        <TableRow key={idx}>
                          <TableCell>{label}</TableCell>
                          <TableCell className="text-left">{(value as number).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-primary/10 font-bold">
                        <TableCell>الإجمالي</TableCell>
                        <TableCell className="text-left text-primary">{data.zakatableSources.total.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-destructive">الحسميات</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {[
                        ['صافي الأصول الثابتة', data.deductions.netFixedAssets],
                        ['الاستثمارات طويلة الأجل', data.deductions.investments],
                        ['مصاريف ما قبل التشغيل', data.deductions.preOperatingExpenses],
                        ['الخسائر المتراكمة', data.deductions.accumulatedLosses],
                      ].map(([label, value], idx) => (
                        <TableRow key={idx}>
                          <TableCell>{label}</TableCell>
                          <TableCell className="text-left">{(value as number).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-destructive/10 font-bold">
                        <TableCell>الإجمالي</TableCell>
                        <TableCell className="text-left text-destructive">{data.deductions.total.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Zakat Summary */}
            <Card className="border-2 border-primary">
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-3 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الوعاء الزكوي المعدل</p>
                    <p className="text-3xl font-bold text-primary">{data.adjustedZakatBase.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">ريال سعودي</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">نسبة الزكاة</p>
                    <p className="text-3xl font-bold">2.5%</p>
                    <p className="text-sm text-muted-foreground">حسب الشريعة الإسلامية</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">الزكاة المستحقة</p>
                    <p className="text-3xl font-bold text-primary">{data.zakatDue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">ريال سعودي</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">اختر السنة المالية لعرض التقرير</p>
        )}
      </CardContent>
    </Card>
  );
}
