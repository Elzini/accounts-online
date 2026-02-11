import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, PieChart, TrendingUp, Target, Activity, 
  CheckCircle, Layers, DollarSign, Users, ShoppingCart 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RPieChart, Pie, Cell } from 'recharts';

const revenueData = [
  { month: 'يناير', revenue: 45000, expenses: 32000 },
  { month: 'فبراير', revenue: 52000, expenses: 35000 },
  { month: 'مارس', revenue: 48000, expenses: 30000 },
  { month: 'أبريل', revenue: 61000, expenses: 38000 },
  { month: 'مايو', revenue: 55000, expenses: 33000 },
  { month: 'يونيو', revenue: 67000, expenses: 40000 },
];

const categoryData = [
  { name: 'سيارات', value: 45 },
  { name: 'قطع غيار', value: 25 },
  { name: 'خدمات', value: 20 },
  { name: 'أخرى', value: 10 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const trendData = [
  { week: 'الأسبوع 1', sales: 120, target: 100 },
  { week: 'الأسبوع 2', sales: 135, target: 110 },
  { week: 'الأسبوع 3', sales: 128, target: 120 },
  { week: 'الأسبوع 4', sales: 155, target: 130 },
];

export function BIAnalyticsPluginPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">📊</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">تحليلات الأعمال BI</h1>
          <p className="text-muted-foreground">لوحات تحليل متقدمة مع مخططات تفاعلية وتقارير ذكية</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-green-500" />v1.2.0</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold">328K</p><p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">+18%</p><p className="text-xs text-muted-foreground">نمو شهري</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Users className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold">156</p><p className="text-xs text-muted-foreground">عملاء نشطين</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Target className="w-8 h-8 mx-auto text-orange-500 mb-2" />
          <p className="text-2xl font-bold">92%</p><p className="text-xs text-muted-foreground">تحقيق الهدف</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue" className="gap-2"><BarChart3 className="w-4 h-4" />الإيرادات</TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2"><PieChart className="w-4 h-4" />التوزيع</TabsTrigger>
          <TabsTrigger value="trends" className="gap-2"><Activity className="w-4 h-4" />الاتجاهات</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">الإيرادات مقابل المصروفات</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="الإيرادات" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--muted-foreground))" name="المصروفات" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">توزيع المبيعات حسب الفئة</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <RPieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">اتجاه المبيعات مقابل الهدف</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} name="المبيعات" />
                  <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} name="الهدف" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
