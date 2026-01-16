import { useState, useMemo } from 'react';
import { Printer, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { useCarTransfers, usePartnerDealerships } from '@/hooks/useTransfers';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useAppSettings } from '@/hooks/useSettings';
import { format } from 'date-fns';

export function TransfersReport() {
  const { data: transfers, isLoading } = useCarTransfers();
  const { data: dealerships } = usePartnerDealerships();
  const { data: settings } = useAppSettings();
  const { printReport } = usePrintReport();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dealershipFilter, setDealershipFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransfers = useMemo(() => {
    if (!transfers) return [];

    return transfers.filter(transfer => {
      const transferDate = new Date(transfer.transfer_date);
      const matchesDateRange = 
        (!startDate || transferDate >= new Date(startDate)) &&
        (!endDate || transferDate <= new Date(endDate));
      
      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
      const matchesType = typeFilter === 'all' || transfer.transfer_type === typeFilter;
      const matchesDealership = dealershipFilter === 'all' || transfer.partner_dealership_id === dealershipFilter;
      
      const matchesSearch = 
        transfer.car?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.car?.chassis_number?.includes(searchQuery) ||
        transfer.partner_dealership?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDateRange && matchesStatus && matchesType && matchesDealership && matchesSearch;
    });
  }, [transfers, startDate, endDate, statusFilter, typeFilter, dealershipFilter, searchQuery]);

  const outgoingTransfers = filteredTransfers.filter(t => t.transfer_type === 'outgoing');
  const incomingTransfers = filteredTransfers.filter(t => t.transfer_type === 'incoming');
  const pendingTransfers = filteredTransfers.filter(t => t.status === 'pending');
  const soldTransfers = filteredTransfers.filter(t => t.status === 'sold');
  const returnedTransfers = filteredTransfers.filter(t => t.status === 'returned');

  const totalCommission = filteredTransfers.reduce((sum, t) => sum + (t.agreed_commission || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'yyyy/MM/dd');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'sold': return 'تم البيع';
      case 'returned': return 'مرتجع';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    return type === 'outgoing' ? 'صادر' : 'وارد';
  };

  const handlePrint = () => {
    printReport({
      title: 'تقرير التحويلات',
      subtitle: settings?.app_name || 'نظام إدارة المعرض',
      columns: [
        { header: 'السيارة', key: 'car' },
        { header: 'رقم الشاسيه', key: 'chassis' },
        { header: 'المعرض', key: 'dealership' },
        { header: 'النوع', key: 'type' },
        { header: 'تاريخ التحويل', key: 'date' },
        { header: 'العمولة', key: 'commission' },
        { header: 'الحالة', key: 'status' },
      ],
      data: filteredTransfers.map(t => ({
        car: `${t.car?.inventory_number} - ${t.car?.name} ${t.car?.model || ''}`,
        chassis: t.car?.chassis_number || '',
        dealership: t.partner_dealership?.name || '',
        type: getTypeText(t.transfer_type),
        date: formatDate(t.transfer_date),
        commission: t.agreed_commission > 0 ? formatCurrency(t.agreed_commission) : '-',
        status: getStatusText(t.status),
      })),
      summaryCards: [
        { label: 'إجمالي التحويلات', value: filteredTransfers.length.toString() },
        { label: 'صادر', value: outgoingTransfers.length.toString() },
        { label: 'وارد', value: incomingTransfers.length.toString() },
        { label: 'قيد الانتظار', value: pendingTransfers.length.toString() },
        { label: 'تم البيع', value: soldTransfers.length.toString() },
        { label: 'إجمالي العمولات', value: formatCurrency(totalCommission) },
      ],
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl">تقرير التحويلات</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
              <Select value={dealershipFilter} onValueChange={setDealershipFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="المعرض" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعارض</SelectItem>
                  {dealerships?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="outgoing">صادر</SelectItem>
                  <SelectItem value="incoming">وارد</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="sold">تم البيع</SelectItem>
                  <SelectItem value="returned">مرتجع</SelectItem>
                </SelectContent>
              </Select>
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي التحويلات</p>
              <p className="text-2xl font-bold">{filteredTransfers.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4 text-red-500" /> صادر
              </p>
              <p className="text-2xl font-bold">{outgoingTransfers.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowDownLeft className="w-4 h-4 text-blue-500" /> وارد
              </p>
              <p className="text-2xl font-bold">{incomingTransfers.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingTransfers.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">تم البيع</p>
              <p className="text-2xl font-bold text-green-600">{soldTransfers.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalCommission)}</p>
            </Card>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">السيارة</TableHead>
                  <TableHead className="text-right">رقم الشاسيه</TableHead>
                  <TableHead className="text-right">المعرض</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">تاريخ التحويل</TableHead>
                  <TableHead className="text-right">تاريخ الإرجاع</TableHead>
                  <TableHead className="text-right">العمولة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {transfer.car?.inventory_number} - {transfer.car?.name} {transfer.car?.model}
                    </TableCell>
                    <TableCell>{transfer.car?.chassis_number}</TableCell>
                    <TableCell>{transfer.partner_dealership?.name}</TableCell>
                    <TableCell>
                      {transfer.transfer_type === 'outgoing' ? (
                        <Badge variant="destructive" className="gap-1">
                          <ArrowUpRight className="w-3 h-3" /> صادر
                        </Badge>
                      ) : (
                        <Badge className="gap-1 bg-blue-500">
                          <ArrowDownLeft className="w-3 h-3" /> وارد
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(transfer.transfer_date)}</TableCell>
                    <TableCell>{transfer.return_date ? formatDate(transfer.return_date) : '-'}</TableCell>
                    <TableCell>
                      {transfer.agreed_commission > 0 
                        ? formatCurrency(transfer.agreed_commission)
                        : transfer.commission_percentage > 0 
                          ? `${transfer.commission_percentage}%`
                          : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        transfer.status === 'sold' ? 'default' : 
                        transfer.status === 'returned' ? 'secondary' : 'outline'
                      }>
                        {getStatusText(transfer.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredTransfers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد تحويلات مطابقة للفلترة
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
