import { useState } from 'react';
import { Plus, FileText, Download, Wallet, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCustody } from '@/hooks/useCustody';
import { calculateCustodySummary, Custody } from '@/services/custody';
import { CustodyFormDialog } from './CustodyFormDialog';
import { CustodySettlementDialog } from './CustodySettlementDialog';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';

export function CustodyPage() {
  const { custodies, isLoading, deleteCustody, isDeleting } = useCustody();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustody, setSelectedCustody] = useState<Custody | null>(null);
  const [settlementCustodyId, setSettlementCustodyId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><Clock className="h-3 w-3" /> نشطة</Badge>;
      case 'settled':
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> مصفاة</Badge>;
      case 'partially_settled':
        return <Badge variant="outline" className="gap-1 text-orange-600"><AlertCircle className="h-3 w-3" /> مصفاة جزئياً</Badge>;
      case 'carried':
        return <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300 bg-blue-50"><Wallet className="h-3 w-3" /> رصيد مرحّل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEdit = (custody: Custody) => {
    setSelectedCustody(custody);
    setIsFormOpen(true);
  };

  const handleSettlement = (custodyId: string) => {
    setSettlementCustodyId(custodyId);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه العهدة؟')) {
      deleteCustody(id);
    }
  };

  // Calculate summary stats
  const totalActiveCustodies = custodies.filter(c => c.status === 'active').length;
  const totalActiveAmount = custodies
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + Number(c.custody_amount), 0);
  const settledCount = custodies.filter(c => c.status === 'settled').length;

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            إدارة العهد
          </h1>
          <p className="text-muted-foreground">إدارة العهد النقدية وتصفيتها</p>
        </div>
        <Button onClick={() => { setSelectedCustody(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة عهدة جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">العهد النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveCustodies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المبالغ النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatNumber(totalActiveAmount)} ر.س</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">العهد المصفاة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{settledCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Custodies Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العهد</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : custodies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد عهد مسجلة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم العهدة</TableHead>
                  <TableHead className="text-right">اسم العهدة</TableHead>
                  <TableHead className="text-right">المستلم</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custodies.map((custody) => {
                  const summary = calculateCustodySummary(custody);
                  return (
                    <TableRow key={custody.id}>
                      <TableCell className="font-medium">#{custody.custody_number}</TableCell>
                      <TableCell>{custody.custody_name}</TableCell>
                      <TableCell>{custody.employee?.name || '-'}</TableCell>
                      <TableCell>{formatNumber(custody.custody_amount)} ر.س</TableCell>
                      <TableCell>{new Date(custody.custody_date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>{getStatusBadge(custody.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSettlement(custody.id)}
                          >
                            <FileText className="h-4 w-4 ml-1" />
                            التصفية
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(custody)}
                            disabled={custody.status === 'settled'}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(custody.id)}
                            disabled={isDeleting}
                          >
                            حذف
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

      {/* Form Dialog */}
      <CustodyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        custody={selectedCustody}
      />

      {/* Settlement Dialog */}
      {settlementCustodyId && (
        <CustodySettlementDialog
          open={!!settlementCustodyId}
          onOpenChange={(open) => !open && setSettlementCustodyId(null)}
          custodyId={settlementCustodyId}
        />
      )}
    </div>
  );
}
