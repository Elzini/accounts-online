import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Palette, Settings2, Move, Eye, EyeOff, RotateCcw, Save, GripVertical } from 'lucide-react';
import { useAdvancedReportSettings, REPORT_TYPES } from './hooks/useAdvancedReportSettings';

export function AdvancedReportSettingsTab() {
  const {
    selectedReportType, setSelectedReportType,
    isLoading, isSaving,
    reportConfig, setReportConfig,
    handleSave, handleResetDefaults,
    toggleColumnVisibility, updateColumnWidth, updateColumnHeight,
    handleDragStart, handleDragEnter, handleDragEnd,
  } = useAdvancedReportSettings();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />اختيار نوع التقرير</CardTitle>
          <CardDescription>اختر التقرير الذي تريد تخصيصه</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedReportType} onValueChange={setSelectedReportType}>
            <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="اختر نوع التقرير" /></SelectTrigger>
            <SelectContent>{REPORT_TYPES.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="columns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="columns">تخصيص الأعمدة</TabsTrigger>
          <TabsTrigger value="style">التنسيق والألوان</TabsTrigger>
          <TabsTrigger value="layout">تخطيط الصفحة</TabsTrigger>
        </TabsList>

        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Move className="w-5 h-5" />تخصيص أعمدة التقرير</CardTitle>
              <CardDescription>اسحب الأعمدة لإعادة ترتيبها، وتحكم في الإظهار والإخفاء والحجم</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {reportConfig.columns.map((column, index) => (
                  <div key={column.id} draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                    className={`p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-move ${!column.visible ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="cursor-grab active:cursor-grabbing"><GripVertical className="w-5 h-5 text-muted-foreground" /></div>
                      <div className="min-w-[120px] font-medium">{column.name}</div>
                      <Button variant="ghost" size="sm" onClick={() => toggleColumnVisibility(column.id)} className="gap-2">
                        {column.visible ? <><Eye className="w-4 h-4" /> ظاهر</> : <><EyeOff className="w-4 h-4" /> مخفي</>}
                      </Button>
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Label className="text-xs whitespace-nowrap">العرض:</Label>
                        <Slider value={[column.width]} onValueChange={([v]) => updateColumnWidth(column.id, v)} min={30} max={300} step={5} className="flex-1" />
                        <span className="text-xs w-12 text-muted-foreground">{column.width}px</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Label className="text-xs whitespace-nowrap">الارتفاع:</Label>
                        <Slider value={[column.height]} onValueChange={([v]) => updateColumnHeight(column.id, v)} min={25} max={80} step={5} className="flex-1" />
                        <span className="text-xs w-12 text-muted-foreground">{column.height}px</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />تنسيق التقرير</CardTitle>
              <CardDescription>تخصيص ألوان وأحجام الخطوط</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>لون رأس الجدول</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={reportConfig.headerColor} onChange={(e) => setReportConfig(prev => ({ ...prev, headerColor: e.target.value }))} className="w-16 h-10 p-1 cursor-pointer" />
                    <Input type="text" value={reportConfig.headerColor} onChange={(e) => setReportConfig(prev => ({ ...prev, headerColor: e.target.value }))} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>حجم الخط</Label>
                  <Select value={reportConfig.fontSize} onValueChange={(v: 'small' | 'medium' | 'large') => setReportConfig(prev => ({ ...prev, fontSize: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">صغير (11px)</SelectItem>
                      <SelectItem value="medium">متوسط (12px)</SelectItem>
                      <SelectItem value="large">كبير (14px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ارتفاع الصفوف الافتراضي</Label>
                <div className="flex items-center gap-4">
                  <Slider value={[reportConfig.rowHeight]} onValueChange={([v]) => setReportConfig(prev => ({ ...prev, rowHeight: v }))} min={25} max={80} step={5} className="flex-1" />
                  <span className="text-sm w-16 text-muted-foreground">{reportConfig.rowHeight}px</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5" />تخطيط الصفحة</CardTitle>
              <CardDescription>التحكم في اتجاه الطباعة والعناصر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>اتجاه الصفحة</Label>
                <Select value={reportConfig.paperOrientation} onValueChange={(v: 'portrait' | 'landscape') => setReportConfig(prev => ({ ...prev, paperOrientation: v }))}>
                  <SelectTrigger className="w-full md:w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">طولي (Portrait)</SelectItem>
                    <SelectItem value="landscape">عرضي (Landscape)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="show_logo">إظهار الشعار</Label>
                  <Switch id="show_logo" checked={reportConfig.showLogo} onCheckedChange={(c) => setReportConfig(prev => ({ ...prev, showLogo: c }))} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="show_header">إظهار رأس التقرير</Label>
                  <Switch id="show_header" checked={reportConfig.showHeader} onCheckedChange={(c) => setReportConfig(prev => ({ ...prev, showHeader: c }))} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="show_footer">إظهار التذييل</Label>
                  <Switch id="show_footer" checked={reportConfig.showFooter} onCheckedChange={(c) => setReportConfig(prev => ({ ...prev, showFooter: c }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <Card>
        <CardHeader><CardTitle>معاينة التقرير</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white overflow-x-auto">
            {reportConfig.showHeader && (
              <div className="flex justify-between items-center border-b-2 pb-4 mb-4" style={{ borderColor: reportConfig.headerColor }}>
                <div className="text-right"><div className="text-lg font-bold">اسم الشركة</div><div className="text-xs text-gray-500">عنوان الشركة</div></div>
                {reportConfig.showLogo && <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">الشعار</div>}
              </div>
            )}
            <table className="w-full border-collapse text-xs">
              <thead><tr>{reportConfig.columns.filter(c => c.visible).map(col => (
                <th key={col.id} className="p-2 text-white text-right border" style={{ backgroundColor: reportConfig.headerColor, width: `${col.width}px`, height: `${col.height}px` }}>{col.name}</th>
              ))}</tr></thead>
              <tbody>
                {[0, 1].map(row => (
                  <tr key={row} className={row === 0 ? 'bg-gray-50' : ''}>
                    {reportConfig.columns.filter(c => c.visible).map(col => (
                      <td key={col.id} className="p-2 border border-gray-200" style={{ height: `${reportConfig.rowHeight}px` }}>بيانات</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {reportConfig.showFooter && (
              <div className="mt-4 pt-2 border-t text-xs text-gray-400 flex justify-between">
                <span>{new Date().toLocaleDateString('ar-SA')}</span><span>صفحة 1</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end sticky bottom-4 bg-background p-4 rounded-lg shadow-lg border">
        <Button variant="outline" onClick={handleResetDefaults} className="gap-2"><RotateCcw className="w-4 h-4" />إعادة للافتراضي</Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}
