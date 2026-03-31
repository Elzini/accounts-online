/**
 * Sales Invoice - Items Table (Cars & Inventory)
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { X, Car, FileSpreadsheet, ChevronDown, Plus, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { useSalesInvoiceData } from './useSalesInvoiceData';

type HookReturn = ReturnType<typeof useSalesInvoiceData>;

interface SalesItemsTableProps {
  hook: HookReturn;
}

export function SalesItemsTable({ hook }: SalesItemsTableProps) {
  const {
    isCarDealership, selectedCars, selectedInventoryItems, calculations,
    remainingCars, availableInventoryItems, savedTemplates, isApproved,
    handleAddCar, handleRemoveCar, handleCarChange,
    handleAddInventoryItem, handleAddManualItem, handleRemoveInventoryItem, handleInventoryItemChange,
    formatCurrency, t,
  } = hook;

  const [carSearchOpen, setCarSearchOpen] = useState(false);

  if (isCarDealership) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b-2 border-emerald-200 dark:border-emerald-800">
              <TableHead className="text-right text-[11px] font-bold w-8 text-emerald-700 dark:text-emerald-400">#</TableHead>
              <TableHead className="text-right text-[11px] font-bold min-w-[180px] text-emerald-700 dark:text-emerald-400">{t.inv_description}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">الحالة</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-16 text-emerald-700 dark:text-emerald-400">{t.inv_quantity}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">{t.inv_price}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">{t.inv_subtotal}</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-28 text-emerald-700 dark:text-emerald-400">شامل الضريبة</TableHead>
              <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedCars.map((car, index) => {
              const calcItem = calculations.items[index];
              return (
                <TableRow key={car.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border-b transition-colors">
                  <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="text-xs py-2 font-medium">{car.car_name} {car.model} {car.color ? `- ${car.color}` : ''} {car.plate_number ? `- لوحة: ${car.plate_number}` : ''}</TableCell>
                  <TableCell className="py-2">
                    <Select value={car.car_condition} onValueChange={(v) => handleCarChange(car.id, 'car_condition', v)} disabled={isApproved}>
                      <SelectTrigger className="h-7 text-[10px] border-0 border-b border-border rounded-none bg-transparent shadow-none w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">جديدة</SelectItem>
                        <SelectItem value="used">مستعملة</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center text-xs py-2">1</TableCell>
                  <TableCell className="py-2">
                    <Input type="number" value={car.sale_price} onChange={(e) => handleCarChange(car.id, 'sale_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" disabled={isApproved} />
                  </TableCell>
                  <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.baseAmount || 0)}</TableCell>
                  <TableCell className="text-center text-xs py-2 font-semibold">
                    {formatCurrency(calcItem?.total || 0)}
                    {car.car_condition === 'used' && <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-normal">ضريبة هامش</span>}
                  </TableCell>
                  <TableCell className="py-2">
                    {selectedCars.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCar(car.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full">
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {Array.from({ length: Math.max(0, 3 - selectedCars.length) }).map((_, i) => (
              <TableRow key={`empty-${i}`} className="border-b border-dashed">
                <TableCell className="text-center text-xs py-2 text-muted-foreground/40 font-mono">{selectedCars.length + i + 1}</TableCell>
                <TableCell className="py-2" colSpan={7}></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-3 border-t flex gap-2 flex-wrap bg-muted/20">
          <Popover open={carSearchOpen} onOpenChange={setCarSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[350px] h-9 text-xs rounded-lg justify-between">
                <span className="flex items-center gap-2">
                  <Search className="w-3 h-3" />
                  {t.inv_select_car_placeholder || 'ابحث بالاسم أو رقم الهيكل...'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
              <Command dir="rtl">
                <CommandInput placeholder="ابحث باسم السيارة أو رقم الهيكل..." className="text-xs" />
                <CommandList>
                  <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">لا توجد سيارات مطابقة</CommandEmpty>
                  <CommandGroup>
                    {remainingCars.map((car) => (
                      <CommandItem
                        key={car.id}
                        value={`${car.name} ${car.model} ${car.chassis_number} ${(car as any).warehouse_location || ''}`}
                        onSelect={() => {
                          handleAddCar(car.id);
                          setCarSearchOpen(false);
                        }}
                        className="text-xs cursor-pointer"
                      >
                        <Car className="w-3 h-3 ml-2 shrink-0" />
                        <span className="font-medium">{car.name} {car.model}</span>
                        {(car as any).warehouse_location && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{(car as any).warehouse_location}</span>
                        )}
                        <span className="text-muted-foreground mr-auto text-[10px]" dir="ltr">{car.chassis_number}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {savedTemplates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 text-xs rounded-lg">
                  <FileSpreadsheet className="w-3 h-3" /> {t.inv_import_template} <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {savedTemplates.map((template) => (
                  <DropdownMenuItem key={template.id} onClick={() => {
                    let matchedCount = 0;
                    template.data.forEach((item) => {
                      const matchingCar = remainingCars.find(car => car.name.includes(item.description) || car.chassis_number === item.description);
                      if (matchingCar) { handleAddCar(matchingCar.id); matchedCount++; }
                    });
                    if (matchedCount > 0) toast.success(t.inv_imported_cars.replace('{count}', String(matchedCount)));
                    else toast.warning(t.inv_no_matching_cars);
                  }}>
                    {template.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  // Inventory Items Table
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b-2 border-emerald-200 dark:border-emerald-800">
            <TableHead className="text-right text-[11px] font-bold w-8 text-emerald-700 dark:text-emerald-400">#</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[180px] text-emerald-700 dark:text-emerald-400">{t.inv_item}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-16 text-emerald-700 dark:text-emerald-400">{t.inv_quantity}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-16 text-emerald-700 dark:text-emerald-400">{t.inv_available}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">{t.inv_price}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-emerald-700 dark:text-emerald-400">{t.inv_subtotal}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-28 text-emerald-700 dark:text-emerald-400">شامل الضريبة</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedInventoryItems.map((item, index) => {
            const calcItem = calculations.inventoryItems[index];
            return (
              <TableRow key={item.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border-b transition-colors">
                <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="py-2">
                  <Input value={item.item_name} onChange={(e) => handleInventoryItemChange(item.id, 'item_name', e.target.value)}
                    placeholder={t.inv_item_name_placeholder || 'اسم الصنف / الخدمة'} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" disabled={isApproved} />
                </TableCell>
                <TableCell className="py-2">
                  <Input type="number" min={1} max={item.available_quantity || undefined} value={item.quantity}
                    onChange={(e) => handleInventoryItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    className="h-7 text-xs text-center w-16 border-0 border-b border-border rounded-none bg-transparent" disabled={isApproved} />
                </TableCell>
                <TableCell className="text-center text-xs py-2 text-muted-foreground">{item.available_quantity}</TableCell>
                <TableCell className="py-2">
                  <Input type="number" value={item.sale_price} onChange={(e) => handleInventoryItemChange(item.id, 'sale_price', e.target.value)}
                    placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" disabled={isApproved} />
                </TableCell>
                <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.baseAmount || 0)}</TableCell>
                <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.total || 0)}</TableCell>
                <TableCell className="py-2">
                  {selectedInventoryItems.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInventoryItem(item.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full">
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {Array.from({ length: Math.max(0, 3 - selectedInventoryItems.length) }).map((_, i) => (
            <TableRow key={`empty-${i}`} className="border-b border-dashed">
              <TableCell className="text-center text-xs py-2 text-muted-foreground/40 font-mono">{selectedInventoryItems.length + i + 1}</TableCell>
              <TableCell className="py-2" colSpan={7}></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-3 border-t flex gap-2 flex-wrap bg-muted/20">
        <Button type="button" variant="outline" size="sm" className="gap-2 h-9 text-xs rounded-lg" onClick={handleAddManualItem} disabled={isApproved}>
          <Plus className="w-3 h-3" /> {t.inv_add_item || 'إضافة صنف'}
        </Button>
        {availableInventoryItems.length > 0 && (
          <Select onValueChange={handleAddInventoryItem}>
            <SelectTrigger className="w-[250px] h-9 text-xs rounded-lg">
              <SelectValue placeholder={t.inv_select_item_placeholder || 'اختر من المخزون...'} />
            </SelectTrigger>
            <SelectContent>
              {availableInventoryItems.map((item: any) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3" /><span>{item.name}</span>
                    {item.barcode && <span className="text-muted-foreground text-xs" dir="ltr">{item.barcode}</span>}
                    <span className="text-muted-foreground text-xs">({item.current_quantity || 0})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
