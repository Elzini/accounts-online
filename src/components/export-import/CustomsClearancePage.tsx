import { FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export function CustomsClearancePage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCheck className="w-6 h-6" />
          {t.customs_title}
        </h1>
        <p className="text-muted-foreground mt-1">{t.customs_subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.customs_at_customs}</CardTitle>
            <CardDescription>{t.customs_at_customs_desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.customs_total_duties}</CardTitle>
            <CardDescription>{t.customs_total_duties_desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0 {t.mod_currency}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.customs_cleared}</CardTitle>
            <CardDescription>{t.customs_cleared_desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}