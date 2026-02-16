import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, ShoppingCart, CreditCard, Barcode, Printer, Package, Receipt, Minus, Plus, Trash2, Search, Settings, DollarSign, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
interface CartItem { id: number; name: string; price: number; qty: number; }
interface Product { id: number; name: string; barcode: string; price: number; stock: number; category: string; }

export function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeSession, setActiveSession] = useState(true);

  const categories = ['الكل', 'زيوت ومواد', 'فلاتر', 'بطاريات', 'إطارات', 'قطع غيار'];

  const products: Product[] = [
    { id: 1, name: 'زيت محرك 5W-30', barcode: '6281001234567', price: 85, stock: 45, category: 'زيوت ومواد' },
    { id: 2, name: 'فلتر هواء', barcode: '6281001234568', price: 45, stock: 120, category: 'فلاتر' },
    { id: 3, name: 'بطارية 70 أمبير', barcode: '6281001234569', price: 350, stock: 18, category: 'بطاريات' },
    { id: 4, name: 'إطار 205/55R16', barcode: '6281001234570', price: 280, stock: 32, category: 'إطارات' },
    { id: 5, name: 'شمعات إشعال NGK', barcode: '6281001234571', price: 35, stock: 200, category: 'قطع غيار' },
    { id: 6, name: 'زيت فرامل DOT4', barcode: '6281001234572', price: 25, stock: 80, category: 'زيوت ومواد' },
    { id: 7, name: 'فلتر زيت', barcode: '6281001234573', price: 30, stock: 150, category: 'فلاتر' },
    { id: 8, name: 'سير مروحة', barcode: '6281001234574', price: 55, stock: 60, category: 'قطع غيار' },
  ];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.includes(searchTerm) || p.barcode.includes(searchTerm);
    const matchCategory = selectedCategory === 'all' || selectedCategory === 'الكل' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const vat = total * 0.15;
  const grandTotal = total + vat;

  const todaySessions = [
    { id: 'POS-001', cashier: 'أحمد محمد', opened: '08:00', closed: '16:00', orders: 45, total: 12500, status: 'closed' },
    { id: 'POS-002', cashier: 'سعد العتيبي', opened: '09:00', closed: null, orders: 23, total: 8750, status: 'open' },
  ];

  const recentOrders = [
    { id: 'ORD-001', date: '2024-01-18 14:30', items: 3, subtotal: 395, vat: 59.25, total: 454.25, method: 'نقدي', customer: 'عميل عام' },
    { id: 'ORD-002', date: '2024-01-18 15:12', items: 1, subtotal: 350, vat: 52.50, total: 402.50, method: 'شبكة', customer: 'محمد أحمد' },
    { id: 'ORD-003', date: '2024-01-18 16:45', items: 5, subtotal: 520, vat: 78.00, total: 598.00, method: 'نقدي', customer: 'عميل عام' },
    { id: 'ORD-004', date: '2024-01-18 17:20', items: 2, subtotal: 130, vat: 19.50, total: 149.50, method: 'شبكة', customer: 'خالد سعد' },
  ];

  const handlePayment = (method: string) => {
    if (cart.length === 0) { toast.error('السلة فارغة'); return; }
    toast.success(`تم الدفع ${method} - المبلغ: ${grandTotal.toFixed(2)} ر.س`);
    setCart([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">نقاط البيع (POS)</h1>
            <p className="text-sm text-muted-foreground">نظام كاشير متكامل للمحلات والمطاعم</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={activeSession ? 'default' : 'secondary'} className="gap-1">
            {activeSession ? '● جلسة مفتوحة' : '○ لا توجد جلسة'}
          </Badge>
          <Button variant="outline" size="sm"><Settings className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="w-8 h-8 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold">12,500</p><p className="text-xs text-muted-foreground">مبيعات اليوم</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <ShoppingCart className="w-8 h-8 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">68</p><p className="text-xs text-muted-foreground">طلبات اليوم</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="w-8 h-8 mx-auto text-orange-500 mb-1" />
          <p className="text-2xl font-bold">183.82</p><p className="text-xs text-muted-foreground">متوسط الطلب</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Users className="w-8 h-8 mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold">2</p><p className="text-xs text-muted-foreground">جلسات نشطة</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="pos">
        <TabsList>
          <TabsTrigger value="pos" className="gap-1"><Monitor className="w-4 h-4" />شاشة البيع</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1"><Receipt className="w-4 h-4" />الطلبات</TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1"><Users className="w-4 h-4" />الجلسات</TabsTrigger>
          <TabsTrigger value="products" className="gap-1"><Package className="w-4 h-4" />المنتجات</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="مسح الباركود أو البحث..." className="pr-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {categories.map(cat => (
                      <Button key={cat} size="sm" variant={selectedCategory === cat || (cat === 'الكل' && selectedCategory === 'all') ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(cat === 'الكل' ? 'all' : cat)}>{cat}</Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {filteredProducts.map(p => (
                      <Button key={p.id} variant="outline" className="h-auto py-3 flex-col relative" onClick={() => addToCart(p)}>
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.price} ر.س</span>
                        <Badge variant="secondary" className="absolute top-1 left-1 text-[10px]">{p.stock}</Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit sticky top-4">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="w-4 h-4" />السلة ({cart.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
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
                      <Button variant="outline" className="gap-1" onClick={() => handlePayment('شبكة')}><CreditCard className="w-4 h-4" />شبكة</Button>
                      <Button className="gap-1" onClick={() => handlePayment('نقدي')}><Receipt className="w-4 h-4" />نقدي</Button>
                    </div>
                    <Button variant="ghost" className="w-full gap-1"><Printer className="w-4 h-4" />طباعة إيصال</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>رقم الطلب</TableHead><TableHead>التاريخ</TableHead><TableHead>العميل</TableHead>
                <TableHead>الأصناف</TableHead><TableHead>المجموع</TableHead><TableHead>الضريبة</TableHead>
                <TableHead>الإجمالي</TableHead><TableHead>الدفع</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {recentOrders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.id}</TableCell>
                    <TableCell>{o.date}</TableCell>
                    <TableCell>{o.customer}</TableCell>
                    <TableCell>{o.items}</TableCell>
                    <TableCell>{o.subtotal} ر.س</TableCell>
                    <TableCell>{o.vat} ر.س</TableCell>
                    <TableCell className="font-bold">{o.total} ر.س</TableCell>
                    <TableCell><Badge variant="outline">{o.method}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الجلسة</TableHead><TableHead>الكاشير</TableHead><TableHead>الفتح</TableHead>
                <TableHead>الإغلاق</TableHead><TableHead>الطلبات</TableHead><TableHead>الإجمالي</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {todaySessions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.id}</TableCell>
                    <TableCell>{s.cashier}</TableCell>
                    <TableCell>{s.opened}</TableCell>
                    <TableCell>{s.closed || '-'}</TableCell>
                    <TableCell>{s.orders}</TableCell>
                    <TableCell>{s.total.toLocaleString()} ر.س</TableCell>
                    <TableCell><Badge variant={s.status === 'open' ? 'default' : 'secondary'}>{s.status === 'open' ? 'مفتوحة' : 'مغلقة'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>المنتج</TableHead><TableHead>الباركود</TableHead><TableHead>الفئة</TableHead>
                <TableHead>السعر</TableHead><TableHead>المخزون</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{p.price} ر.س</TableCell>
                    <TableCell><Badge variant={p.stock < 20 ? 'destructive' : 'default'}>{p.stock}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
