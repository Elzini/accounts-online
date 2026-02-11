import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Monitor, ShoppingCart, CreditCard, Barcode, Printer, 
  CheckCircle, Package, Receipt, Minus, Plus, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';

export function POSPluginPage() {
  const [cart, setCart] = useState([
    { id: 1, name: 'زيت محرك 5W-30', price: 85, qty: 2 },
    { id: 2, name: 'فلتر هواء', price: 45, qty: 1 },
  ]);

  const products = [
    { id: 1, name: 'زيت محرك 5W-30', barcode: '6281001234567', price: 85, stock: 45 },
    { id: 2, name: 'فلتر هواء', barcode: '6281001234568', price: 45, stock: 120 },
    { id: 3, name: 'بطارية 70 أمبير', barcode: '6281001234569', price: 350, stock: 18 },
    { id: 4, name: 'إطار 205/55R16', barcode: '6281001234570', price: 280, stock: 32 },
    { id: 5, name: 'شمعات إشعال', barcode: '6281001234571', price: 35, stock: 200 },
  ];

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const vat = total * 0.15;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">🖥️</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">نقاط البيع POS</h1>
          <p className="text-muted-foreground">نظام نقاط بيع متكامل مع دعم الباركود والطابعات الحرارية</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-green-500" />v1.0.0</Badge>
      </div>

      <Tabs defaultValue="pos">
        <TabsList>
          <TabsTrigger value="pos" className="gap-2"><Monitor className="w-4 h-4" />شاشة البيع</TabsTrigger>
          <TabsTrigger value="products" className="gap-2"><Package className="w-4 h-4" />المنتجات</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2"><Receipt className="w-4 h-4" />المعاملات</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex gap-2 mb-4">
                    <Barcode className="w-5 h-5 text-muted-foreground mt-2" />
                    <Input placeholder="مسح الباركود أو البحث عن منتج..." className="flex-1" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {products.map(p => (
                      <Button key={p.id} variant="outline" className="h-auto py-3 flex-col" onClick={() => {
                        setCart(prev => {
                          const existing = prev.find(c => c.id === p.id);
                          if (existing) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
                          return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
                        });
                      }}>
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.price} ر.س</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="w-4 h-4" />السلة</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="flex-1">{item.name}</span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: Math.max(1, c.qty - 1) } : c))}><Minus className="w-3 h-3" /></Button>
                      <span className="w-6 text-center">{item.qty}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))}><Plus className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setCart(prev => prev.filter(c => c.id !== item.id))}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <span className="w-20 text-left font-medium">{(item.price * item.qty).toLocaleString()} ر.س</span>
                  </div>
                ))}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm"><span>المجموع:</span><span>{total.toLocaleString()} ر.س</span></div>
                  <div className="flex justify-between text-sm"><span>ضريبة 15%:</span><span>{vat.toLocaleString()} ر.س</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>الإجمالي:</span><span>{(total + vat).toLocaleString()} ر.س</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-1"><CreditCard className="w-4 h-4" />شبكة</Button>
                  <Button className="gap-1" onClick={() => toast.success('تمت عملية الدفع')}><Receipt className="w-4 h-4" />نقدي</Button>
                </div>
                <Button variant="ghost" className="w-full gap-1"><Printer className="w-4 h-4" />طباعة إيصال</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">قائمة المنتجات</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead><TableHead>الباركود</TableHead>
                    <TableHead>السعر</TableHead><TableHead>المخزون</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                      <TableCell>{p.price} ر.س</TableCell>
                      <TableCell><Badge variant={p.stock < 20 ? 'destructive' : 'default'}>{p.stock}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">آخر المعاملات</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead><TableHead>التاريخ</TableHead>
                    <TableHead>الأصناف</TableHead><TableHead>المبلغ</TableHead><TableHead>الدفع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: 'POS-001', date: '2024-01-18 14:30', items: 3, amount: 455, method: 'نقدي' },
                    { id: 'POS-002', date: '2024-01-18 15:12', items: 1, amount: 350, method: 'شبكة' },
                    { id: 'POS-003', date: '2024-01-18 16:45', items: 5, amount: 680, method: 'نقدي' },
                  ].map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono">{t.id}</TableCell>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>{t.items}</TableCell>
                      <TableCell>{t.amount} ر.س</TableCell>
                      <TableCell><Badge variant="outline">{t.method}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
