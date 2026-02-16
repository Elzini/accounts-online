import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Monitor, ShoppingCart, CreditCard, Receipt, Minus, Plus, Trash2, Search, DollarSign, TrendingUp, Users, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useItems } from '@/hooks/useInventory';
import { usePOSSessions, usePOSOrders, useAddPOSOrder } from '@/hooks/useModuleData';

interface CartItem { id: string; name: string; price: number; qty: number; }

export function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: items = [] } = useItems();
  const { data: sessions = [] } = usePOSSessions();
  const { data: orders = [] } = usePOSOrders();
  const addOrder = useAddPOSOrder();

  const filteredProducts = (items as any[]).filter((p: any) => p.name?.includes(searchTerm) || p.barcode?.includes(searchTerm));

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: product.id, name: product.name, price: product.sale_price_1 || 0, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const vat = total * 0.15;
  const grandTotal = total + vat;

  const handlePayment = (method: string) => {
    if (cart.length === 0) { toast.error('السلة فارغة'); return; }
    addOrder.mutate({
      order: { subtotal: total, tax: vat, total: grandTotal, payment_method: method === 'شبكة' ? 'card' : 'cash', order_number: `POS-${Date.now()}` },
      lines: cart.map(item => ({ item_id: item.id, item_name: item.name, quantity: item.qty, unit_price: item.price, total: item.price * item.qty })),
    }, { onSuccess: () => setCart([]) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Monitor className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">نقاط البيع (POS)</h1><p className="text-sm text-muted-foreground">نظام كاشير متكامل</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{orders.reduce((s: number, o: any) => s + (o.total || 0), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">إجمالي المبيعات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><ShoppingCart className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">طلبات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingUp className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{orders.length > 0 ? (orders.reduce((s: number, o: any) => s + (o.total || 0), 0) / orders.length).toFixed(0) : 0}</p><p className="text-xs text-muted-foreground">متوسط الطلب</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Package className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{items.length}</p><p className="text-xs text-muted-foreground">أصناف</p></CardContent></Card>
      </div>

      <Tabs defaultValue="pos">
        <TabsList>
          <TabsTrigger value="pos" className="gap-1"><Monitor className="w-4 h-4" />شاشة البيع</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1"><Receipt className="w-4 h-4" />الطلبات</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card><CardContent className="pt-4">
                <div className="relative mb-4">
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="مسح الباركود أو البحث..." className="pr-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                {filteredProducts.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد أصناف. أضف أصنافاً من قسم المخزون أولاً.</p> :
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {filteredProducts.slice(0, 20).map((p: any) => (
                    <Button key={p.id} variant="outline" className="h-auto py-3 flex-col relative" onClick={() => addToCart(p)}>
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.sale_price_1 || 0} ر.س</span>
                      <Badge variant="secondary" className="absolute top-1 left-1 text-[10px]">{p.current_quantity || 0}</Badge>
                    </Button>
                  ))}
                </div>}
              </CardContent></Card>
            </div>

            <Card className="h-fit sticky top-4">
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-bold flex items-center gap-2"><ShoppingCart className="w-4 h-4" />السلة ({cart.length})</h3>
                {cart.length === 0 && <p className="text-center text-muted-foreground py-8">السلة فارغة</p>}
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <span className="flex-1 truncate">{item.name}</span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: Math.max(1, c.qty - 1) } : c))}><Minus className="w-3 h-3" /></Button>
                      <span className="w-6 text-center font-medium">{item.qty}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))}><Plus className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setCart(prev => prev.filter(c => c.id !== item.id))}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <span className="w-20 text-left font-medium">{(item.price * item.qty).toLocaleString()} ر.س</span>
                  </div>
                ))}
                {cart.length > 0 && (
                  <>
                    <div className="border-t pt-3 space-y-1">
                      <div className="flex justify-between text-sm"><span>المجموع:</span><span>{total.toLocaleString()} ر.س</span></div>
                      <div className="flex justify-between text-sm text-muted-foreground"><span>ضريبة 15%:</span><span>{vat.toFixed(2)} ر.س</span></div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2"><span>الإجمالي:</span><span>{grandTotal.toFixed(2)} ر.س</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="gap-1" onClick={() => handlePayment('شبكة')} disabled={addOrder.isPending}><CreditCard className="w-4 h-4" />شبكة</Button>
                      <Button className="gap-1" onClick={() => handlePayment('نقدي')} disabled={addOrder.isPending}><Receipt className="w-4 h-4" />نقدي</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card><CardContent className="pt-4">
            {orders.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد طلبات بعد.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>رقم الطلب</TableHead><TableHead>التاريخ</TableHead><TableHead>المجموع</TableHead><TableHead>الضريبة</TableHead><TableHead>الإجمالي</TableHead><TableHead>الدفع</TableHead></TableRow></TableHeader>
              <TableBody>{orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono">{o.order_number || '-'}</TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleString('ar')}</TableCell>
                  <TableCell>{(o.subtotal || 0).toLocaleString()} ر.س</TableCell>
                  <TableCell>{(o.tax || 0).toFixed(2)} ر.س</TableCell>
                  <TableCell className="font-bold">{(o.total || 0).toLocaleString()} ر.س</TableCell>
                  <TableCell><Badge variant="outline">{o.payment_method === 'cash' ? 'نقدي' : 'شبكة'}</Badge></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
