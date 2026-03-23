/**
 * Purchase Invoice - Items Table (Cars or Inventory)
 * Renders car-specific or general inventory table based on company type.
 */
import { Plus, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { usePurchaseInvoice } from '@/hooks/usePurchaseInvoice';

type HookReturn = ReturnType<typeof usePurchaseInvoice>;

interface PurchaseItemsTableProps {
  hook: HookReturn;
}

export function PurchaseItemsTable({ hook }: PurchaseItemsTableProps) {
  const {
    isCarDealership, cars, purchaseInventoryItems, calculations, inventoryItems,
    handleAddCar, handleRemoveCar, handleCarChange,
    handleAddInventoryItem, handleSelectExistingItem, handleRemoveInventoryItem, handleInventoryItemChange,
    formatCurrency, t,
  } = hook;

  if (isCarDealership) {
    return <CarItemsTable hook={hook} />;
  }
  return <InventoryItemsTable hook={hook} />;
}

function CarItemsTable({ hook }: PurchaseItemsTableProps) {
  const { cars, calculations, handleAddCar, handleRemoveCar, handleCarChange, formatCurrency, t } = hook;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-l from-primary/5 to-primary/10 border-b-2 border-primary/20">
            <TableHead className="text-right text-[11px] font-bold w-8 text-primary">#</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[150px] text-primary">{t.inv_description}</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[80px] text-primary">{t.inv_model}</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[60px] text-primary">{t.inv_color}</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[100px] text-primary">{t.inv_chassis_number}</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[80px] text-primary">رقم اللوحة</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-primary">الحالة</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-16 text-primary">{t.inv_quantity}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-primary">{t.inv_price}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-primary">{t.inv_subtotal}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-28 text-primary">شامل الضريبة</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car, index) => {
            const calcItem = calculations.items[index];
            return (
              <TableRow key={car.id} className="hover:bg-primary/5 border-b transition-colors">
                <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="py-2"><Input value={car.name} onChange={(e) => handleCarChange(car.id, 'name', e.target.value)} placeholder={t.inv_car_name} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" /></TableCell>
                <TableCell className="py-2"><Input value={car.model} onChange={(e) => handleCarChange(car.id, 'model', e.target.value)} placeholder={t.inv_model} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" /></TableCell>
                <TableCell className="py-2"><Input value={car.color} onChange={(e) => handleCarChange(car.id, 'color', e.target.value)} placeholder={t.inv_color} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" /></TableCell>
                <TableCell className="py-2"><Input value={car.chassis_number} onChange={(e) => handleCarChange(car.id, 'chassis_number', e.target.value)} placeholder={t.inv_chassis_number} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                <TableCell className="py-2"><Input value={car.plate_number} onChange={(e) => handleCarChange(car.id, 'plate_number', e.target.value)} placeholder="رقم اللوحة" className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                <TableCell className="py-2">
                  <Select value={car.car_condition} onValueChange={(v) => handleCarChange(car.id, 'car_condition', v)}>
                    <SelectTrigger className="h-7 text-[10px] border-0 border-b border-border rounded-none bg-transparent shadow-none w-20"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="new">جديدة</SelectItem><SelectItem value="used">مستعملة</SelectItem></SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center text-xs py-2">{car.quantity}</TableCell>
                <TableCell className="py-2"><Input type="number" value={car.purchase_price} onChange={(e) => handleCarChange(car.id, 'purchase_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
                <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.baseAmount || 0)}</TableCell>
                <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(calcItem?.total || 0)}</TableCell>
                <TableCell className="py-2">
                  {cars.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCar(car.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full"><X className="w-3 h-3" /></Button>}
                </TableCell>
              </TableRow>
            );
          })}
          {Array.from({ length: Math.max(0, 3 - cars.length) }).map((_, i) => (
            <TableRow key={`empty-${i}`} className="border-b border-dashed">
              <TableCell className="text-center text-xs py-2 text-muted-foreground/40 font-mono">{cars.length + i + 1}</TableCell>
              <TableCell className="py-2" colSpan={11}></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-3 border-t bg-muted/20">
        <Button type="button" variant="outline" size="sm" onClick={handleAddCar} className="gap-1.5 text-xs h-9 rounded-lg"><Plus className="w-3.5 h-3.5" />{t.inv_add_car}</Button>
      </div>
    </div>
  );
}

function InventoryItemsTable({ hook }: PurchaseItemsTableProps) {
  const {
    purchaseInventoryItems, calculations, inventoryItems,
    handleAddInventoryItem, handleSelectExistingItem, handleRemoveInventoryItem, handleInventoryItemChange,
    formatCurrency, t,
  } = hook;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-l from-primary/5 to-primary/10 border-b-2 border-primary/20">
            <TableHead className="text-right text-[11px] font-bold w-8 text-primary">#</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[180px] text-primary">{t.inv_item}</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[80px] text-primary">{t.inv_barcode}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-16 text-primary">{t.inv_quantity}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-16 text-primary">{t.inv_unit}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-primary">{t.inv_purchase_price}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-primary">{t.inv_subtotal}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-28 text-primary">شامل الضريبة</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calculations.inventoryItems.map((item, index) => (
            <TableRow key={item.id} className="hover:bg-primary/5 border-b transition-colors">
              <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{index + 1}</TableCell>
              <TableCell className="py-2"><Input value={purchaseInventoryItems[index]?.item_name || ''} onChange={(e) => handleInventoryItemChange(item.id, 'item_name', e.target.value)} placeholder={t.inv_item_name_placeholder || 'اسم الصنف / الخدمة'} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" /></TableCell>
              <TableCell className="py-2"><Input value={purchaseInventoryItems[index]?.barcode || ''} onChange={(e) => handleInventoryItemChange(item.id, 'barcode', e.target.value)} placeholder={t.inv_barcode} className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
              <TableCell className="py-2"><Input type="number" min={1} value={purchaseInventoryItems[index]?.quantity || 1} onChange={(e) => handleInventoryItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} className="h-7 text-xs text-center border-0 border-b border-border rounded-none bg-transparent w-16" /></TableCell>
              <TableCell className="text-center text-xs py-2">{item.unit_name}</TableCell>
              <TableCell className="py-2"><Input type="number" value={purchaseInventoryItems[index]?.purchase_price || ''} onChange={(e) => handleInventoryItemChange(item.id, 'purchase_price', e.target.value)} placeholder="0" className="h-7 text-xs text-center w-24 border-0 border-b border-border rounded-none bg-transparent" dir="ltr" /></TableCell>
              <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(item.baseAmount)}</TableCell>
              <TableCell className="text-center text-xs py-2 font-semibold">{formatCurrency(item.total)}</TableCell>
              <TableCell className="py-2">
                {purchaseInventoryItems.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInventoryItem(item.id)} className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full"><X className="w-3 h-3" /></Button>}
              </TableCell>
            </TableRow>
          ))}
          {Array.from({ length: Math.max(0, 3 - purchaseInventoryItems.length) }).map((_, i) => (
            <TableRow key={`empty-${i}`} className="border-b border-dashed">
              <TableCell className="text-center text-xs py-2 text-muted-foreground/40 font-mono">{purchaseInventoryItems.length + i + 1}</TableCell>
              <TableCell className="py-2" colSpan={8}></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-3 border-t flex gap-2 bg-muted/20">
        <Button type="button" variant="outline" size="sm" onClick={handleAddInventoryItem} className="gap-1.5 text-xs h-9 rounded-lg"><Plus className="w-3.5 h-3.5" />{t.inv_add_item || 'إضافة صنف'}</Button>
        {(inventoryItems || []).length > 0 && (
          <Select onValueChange={handleSelectExistingItem}>
            <SelectTrigger className="h-9 text-xs w-[250px] rounded-lg"><SelectValue placeholder={t.inv_select_inventory_item || 'اختر من المخزون...'} /></SelectTrigger>
            <SelectContent>
              {(inventoryItems || []).map((item: any) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2"><Package className="w-3 h-3" />{item.name} {item.barcode ? `(${item.barcode})` : ''}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
