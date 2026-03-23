/**
 * CarPurchasesView - Car dealership purchases table (desktop + mobile)
 */
import { ShoppingCart, Car, Calendar, Hash, RefreshCw, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchFilter } from '@/components/ui/search-filter';
import { CarActions } from '@/components/actions/CarActions';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card-list';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ActivePage } from '@/types';
import { PurchasesTotalsFooter } from './PurchasesTotalsFooter';
import { getStatusBadge } from './statusBadge';

interface Props {
  setActivePage: (page: ActivePage) => void;
  hook: ReturnType<typeof import('./usePurchasesTable').usePurchasesTable>;
}

export function CarPurchasesView({ setActivePage, hook }: Props) {
  const {
    t, language, isMobile, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    isRefreshing, cars, filteredCars, carTotals, carExpensesMap,
    taxRate, currency,
    formatCurrency, formatDate, calculateTaxDetails, getPaymentMethodInfo, getCarExpensesTotal,
    handleRefresh,
  } = hook;

  const filterOptions = [
    { value: 'available', label: t.status_available },
    { value: 'sold', label: t.status_sold },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.nav_purchases}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.subtitle_manage_inventory}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="h-10 sm:h-11">
            <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.btn_refresh}
          </Button>
          <Button onClick={() => setActivePage('add-purchase')} className="gradient-primary hover:opacity-90 flex-1 sm:flex-initial h-10 sm:h-11">
            <ShoppingCart className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t.btn_add_car}
          </Button>
        </div>
      </div>

      <SearchFilter
        searchPlaceholder={t.search_purchases} searchValue={searchQuery} onSearchChange={setSearchQuery}
        filterOptions={filterOptions} filterValue={statusFilter} onFilterChange={setStatusFilter}
        filterPlaceholder={t.filter_status}
      />

      {isMobile ? (
        <div className="space-y-3">
          {filteredCars.map((car) => {
            const taxDetails = calculateTaxDetails(Number(car.purchase_price), (car as any).car_condition);
            const paymentInfo = getPaymentMethodInfo((car as any).payment_account?.code);
            return (
              <MobileCard key={car.id}>
                <MobileCardHeader title={car.name} subtitle={`${car.model || ''} ${car.color ? `- ${car.color}` : ''}`}
                  badge={getStatusBadge(car.status, language, t)} actions={<CarActions car={car} />} />
                <div className="space-y-1">
                  <MobileCardRow label={t.th_inventory_number} value={car.inventory_number} icon={<Hash className="w-3.5 h-3.5" />} />
                  <MobileCardRow label={t.th_chassis_number} value={<span dir="ltr" className="font-mono text-xs">{car.chassis_number}</span>} icon={<Car className="w-3.5 h-3.5" />} />
                  <MobileCardRow label={t.th_base_amount} value={`${formatCurrency(taxDetails.baseAmount)} ${currency}`} icon={<Wallet className="w-3.5 h-3.5" />} />
                  {taxRate > 0 && <MobileCardRow label={`${t.th_tax} (${taxRate}%)`} value={<span className="text-orange-600">{formatCurrency(taxDetails.taxAmount)} {currency}</span>} />}
                  <MobileCardRow label={t.th_total_with_tax} value={<span className="text-primary font-bold">{formatCurrency(taxDetails.totalWithTax)} {currency}</span>} />
                  {(() => {
                    const carExps = carExpensesMap[car.id] || [];
                    const expTotal = getCarExpensesTotal(car.id);
                    return carExps.length > 0 ? (
                      <>
                        <MobileCardRow label="المصروفات" icon={<Receipt className="w-3.5 h-3.5" />}
                          value={<div className="text-sm">{carExps.map((e, i) => (
                            <div key={i} className="flex justify-between gap-2">
                              <span className="text-muted-foreground">{e.description}</span>
                              <span className="text-orange-600 font-medium">{formatCurrency(e.amount)} {currency}</span>
                            </div>
                          ))}</div>} />
                        <MobileCardRow label="إجمالي التكلفة" value={<span className="text-success font-bold">{formatCurrency(taxDetails.totalWithTax + expTotal)} {currency}</span>} />
                      </>
                    ) : null;
                  })()}
                  <MobileCardRow label={t.th_purchase_date} value={formatDate(car.purchase_date)} icon={<Calendar className="w-3.5 h-3.5" />} />
                  <MobileCardRow label={t.th_payment_method} value={<span className={paymentInfo.color}>{paymentInfo.label}</span>} />
                </div>
              </MobileCard>
            );
          })}

          {filteredCars.length > 0 && (
            <div className="grid grid-cols-1 gap-3 mt-4">
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">{t.total_base_amount}</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(carTotals.baseAmount))} {currency}</p>
              </div>
              {taxRate > 0 && (
                <div className="bg-card rounded-xl p-4 border">
                  <p className="text-xs text-muted-foreground">{t.total_tax} ({taxRate}%)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(carTotals.taxAmount))} {currency}</p>
                </div>
              )}
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">{t.total_purchases_with_tax}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(carTotals.totalWithTax))} {currency}</p>
              </div>
            </div>
          )}
          {cars.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground mb-4">{t.no_cars_in_stock}</p>
              <Button onClick={() => setActivePage('add-purchase')} className="gradient-primary">{t.add_first_car}</Button>
            </div>
          )}
          {cars.length > 0 && filteredCars.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <Table className="min-w-[1400px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{t.th_inventory_number}</TableHead>
                <TableHead className="text-right font-bold">{t.th_car_name}</TableHead>
                <TableHead className="text-right font-bold">{t.th_model}</TableHead>
                <TableHead className="text-right font-bold">{t.th_color}</TableHead>
                <TableHead className="text-right font-bold">{t.th_chassis_number}</TableHead>
                <TableHead className="text-right font-bold">رقم اللوحة</TableHead>
                <TableHead className="text-right font-bold">{t.th_base_amount}</TableHead>
                <TableHead className="text-right font-bold">{t.th_tax} ({taxRate}%)</TableHead>
                <TableHead className="text-right font-bold">{t.th_total_with_tax}</TableHead>
                <TableHead className="text-right font-bold">المصروفات</TableHead>
                <TableHead className="text-right font-bold">إجمالي التكلفة</TableHead>
                <TableHead className="text-right font-bold">{t.th_payment_method}</TableHead>
                <TableHead className="text-right font-bold">{t.th_purchase_date}</TableHead>
                <TableHead className="text-right font-bold">{t.th_status}</TableHead>
                <TableHead className="text-right font-bold">{t.th_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => {
                const taxDetails = calculateTaxDetails(Number(car.purchase_price), (car as any).car_condition);
                const paymentInfo = getPaymentMethodInfo((car as any).payment_account?.code);
                const PaymentIcon = paymentInfo.icon;
                return (
                  <TableRow key={car.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{car.inventory_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{car.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{car.model || '-'}</TableCell>
                    <TableCell>{car.color || '-'}</TableCell>
                    <TableCell dir="ltr" className="text-right font-mono text-sm">{car.chassis_number}</TableCell>
                    <TableCell>{(car as any).plate_number || '-'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(taxDetails.baseAmount)} {currency}</TableCell>
                    <TableCell className="text-orange-600 font-medium">{formatCurrency(taxDetails.taxAmount)} {currency}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatCurrency(taxDetails.totalWithTax)} {currency}</TableCell>
                    <TableCell>
                      {(() => {
                        const carExps = carExpensesMap[car.id] || [];
                        if (carExps.length === 0) return <span className="text-muted-foreground">-</span>;
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-orange-600 font-medium cursor-help underline decoration-dotted">
                                  {formatCurrency(getCarExpensesTotal(car.id))} {currency}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1 text-sm">
                                  {carExps.map((e, i) => (
                                    <div key={i} className="flex justify-between gap-4">
                                      <span>{e.description}</span>
                                      <span className="font-bold">{formatCurrency(e.amount)} {currency}</span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="font-bold text-success">
                      {formatCurrency(taxDetails.totalWithTax + getCarExpensesTotal(car.id))} {currency}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PaymentIcon className={`w-4 h-4 ${paymentInfo.color}`} />
                        <span className={paymentInfo.color}>{paymentInfo.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(car.purchase_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(car.status, language, t)}</TableCell>
                    <TableCell><CarActions car={car} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredCars.length > 0 && (
            <PurchasesTotalsFooter
              baseAmount={carTotals.baseAmount} taxAmount={carTotals.taxAmount}
              totalWithTax={carTotals.totalWithTax} taxRate={taxRate}
              currency={currency} formatCurrency={formatCurrency} t={t}
            />
          )}

          {cars.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_cars_in_stock}</p>
              <Button onClick={() => setActivePage('add-purchase')} className="mt-4 gradient-primary">{t.add_first_car}</Button>
            </div>
          )}
          {cars.length > 0 && filteredCars.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
