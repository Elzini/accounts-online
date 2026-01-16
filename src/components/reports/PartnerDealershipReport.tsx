import { useState, useMemo } from 'react';
import { Printer, ArrowUpRight, ArrowDownLeft, Building2, Phone, MapPin, User, ArrowRight } from 'lucide-react';
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
import { ActivePage } from '@/types';

interface PartnerDealershipReportProps {
  setActivePage: (page: ActivePage) => void;
}

export function PartnerDealershipReport({ setActivePage }: PartnerDealershipReportProps) {
  const { data: transfers, isLoading: transfersLoading } = useCarTransfers();
  const { data: dealerships, isLoading: dealershipsLoading } = usePartnerDealerships();
  const { data: settings } = useAppSettings();
  const { printReport } = usePrintReport();

  const [selectedDealershipId, setSelectedDealershipId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedDealership = dealerships?.find(d => d.id === selectedDealershipId);

  const dealershipTransfers = useMemo(() => {
    if (!transfers || !selectedDealershipId) return [];

    return transfers.filter(transfer => {
      const matchesDealership = transfer.partner_dealership_id === selectedDealershipId;
      
      const transferDate = new Date(transfer.transfer_date);
      const matchesDateRange = 
        (!startDate || transferDate >= new Date(startDate)) &&
        (!endDate || transferDate <= new Date(endDate));
      
      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;

      return matchesDealership && matchesDateRange && matchesStatus;
    });
  }, [transfers, selectedDealershipId, startDate, endDate, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const outgoing = dealershipTransfers.filter(t => t.transfer_type === 'outgoing');
    const incoming = dealershipTransfers.filter(t => t.transfer_type === 'incoming');
    const pending = dealershipTransfers.filter(t => t.status === 'pending');
    const sold = dealershipTransfers.filter(t => t.status === 'sold');
    const returned = dealershipTransfers.filter(t => t.status === 'returned');

    // Commissions we owe them (cars we received and sold)
    const commissionsOwed = incoming
      .filter(t => t.status === 'sold')
      .reduce((sum, t) => sum + (t.actual_commission || t.agreed_commission || 0), 0);

    // Commissions they owe us (cars we sent and they sold)
    const commissionsEarned = outgoing
      .filter(t => t.status === 'sold')
      .reduce((sum, t) => sum + (t.actual_commission || t.agreed_commission || 0), 0);

    // Total sales value
    const totalSalesValue = sold.reduce((sum, t) => sum + (t.sale_price || 0), 0);

    return {
      totalTransfers: dealershipTransfers.length,
      outgoingCount: outgoing.length,
      incomingCount: incoming.length,
      pendingCount: pending.length,
      soldCount: sold.length,
      returnedCount: returned.length,
      commissionsOwed,
      commissionsEarned,
      netCommission: commissionsEarned - commissionsOwed,
      totalSalesValue,
    };
  }, [dealershipTransfers]);

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
    if (!selectedDealership) return;

    printReport({
      title: `تقرير المعرض: ${selectedDealership.name}`,
      subtitle: settings?.app_name || 'نظام إدارة المعرض',
      columns: [
        { header: 'السيارة', key: 'car' },
        { header: 'رقم الشاسيه', key: 'chassis' },
        { header: 'النوع', key: 'type' },
        { header: 'تاريخ التحويل', key: 'date' },
        { header: 'سعر البيع', key: 'salePrice' },
        { header: 'العمولة', key: 'commission' },
        { header: 'الحالة', key: 'status' },
      ],
      data: dealershipTransfers.map(t => ({
        car: `${t.car?.inventory_number} - ${t.car?.name} ${t.car?.model || ''}`,
        chassis: t.car?.chassis_number || '',
        type: getTypeText(t.transfer_type),
        date: formatDate(t.transfer_date),
        salePrice: t.sale_price > 0 ? formatCurrency(t.sale_price) : '-',
        commission: t.actual_commission > 0 
          ? formatCurrency(t.actual_commission) 
          : t.agreed_commission > 0 
            ? formatCurrency(t.agreed_commission) 
            : '-',
        status: getStatusText(t.status),
      })),
      summaryCards: [
        { label: 'إجمالي التحويلات', value: stats.totalTransfers.toString() },
        { label: 'صادر', value: stats.outgoingCount.toString() },
        { label: 'وارد', value: stats.incomingCount.toString() },
        { label: 'تم البيع', value: stats.soldCount.toString() },
        { label: 'عمولات مستحقة لنا', value: formatCurrency(stats.commissionsEarned) },
        { label: 'عمولات مستحقة عليهم', value: formatCurrency(stats.commissionsOwed) },
      ],
    });
  };

  const isLoading = transfersLoading || dealershipsLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Dealership Selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              تقرير المعرض الشريك
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={selectedDealershipId} onValueChange={setSelectedDealershipId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="اختر المعرض" />
                </SelectTrigger>
                <SelectContent>
                  {dealerships?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDealershipId && (
                <>
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
                </>
              )}
              <Button variant="outline" onClick={() => setActivePage('partner-dealerships')} className="gap-2">
                <ArrowRight className="w-4 h-4" />
                المعارض
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!selectedDealershipId ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">اختر معرض شريك لعرض التقرير المفصل</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Dealership Info */}
          {selectedDealership && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{selectedDealership.name}</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedDealership.phone}</span>
                      </div>
                      {selectedDealership.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedDealership.address}</span>
                        </div>
                      )}
                      {selectedDealership.contact_person && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{selectedDealership.contact_person}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <Card className="p-4 bg-blue-50 dark:bg-blue-950">
                      <p className="text-sm text-muted-foreground">عمولات مستحقة لنا</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.commissionsEarned)}</p>
                    </Card>
                    <Card className="p-4 bg-orange-50 dark:bg-orange-950">
                      <p className="text-sm text-muted-foreground">عمولات مستحقة علينا</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.commissionsOwed)}</p>
                    </Card>
                    <Card className={`p-4 col-span-2 ${stats.netCommission >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                      <p className="text-sm text-muted-foreground">صافي العمولات</p>
                      <p className={`text-2xl font-bold ${stats.netCommission >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.netCommission)}
                        <span className="text-sm font-normal mr-2">
                          {stats.netCommission >= 0 ? '(لصالحنا)' : '(علينا)'}
                        </span>
                      </p>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي التحويلات</p>
              <p className="text-2xl font-bold">{stats.totalTransfers}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4 text-red-500" /> صادر
              </p>
              <p className="text-2xl font-bold">{stats.outgoingCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowDownLeft className="w-4 h-4 text-blue-500" /> وارد
              </p>
              <p className="text-2xl font-bold">{stats.incomingCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">تم البيع</p>
              <p className="text-2xl font-bold text-green-600">{stats.soldCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalSalesValue)}</p>
            </Card>
          </div>

          {/* Transfers Table */}
          <Card>
            <CardHeader>
              <CardTitle>سجل التحويلات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">السيارة</TableHead>
                      <TableHead className="text-right">رقم الشاسيه</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">تاريخ التحويل</TableHead>
                      <TableHead className="text-right">سعر البيع</TableHead>
                      <TableHead className="text-right">العمولة المتفق عليها</TableHead>
                      <TableHead className="text-right">العمولة الفعلية</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealershipTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          {transfer.car?.inventory_number} - {transfer.car?.name} {transfer.car?.model}
                        </TableCell>
                        <TableCell>{transfer.car?.chassis_number}</TableCell>
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
                        <TableCell>
                          {transfer.sale_price > 0 ? formatCurrency(transfer.sale_price) : '-'}
                        </TableCell>
                        <TableCell>
                          {transfer.agreed_commission > 0 
                            ? formatCurrency(transfer.agreed_commission)
                            : transfer.commission_percentage > 0 
                              ? `${transfer.commission_percentage}%`
                              : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {transfer.actual_commission > 0 
                            ? <span className="text-green-600 font-medium">{formatCurrency(transfer.actual_commission)}</span>
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
                {dealershipTransfers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد تحويلات لهذا المعرض
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
