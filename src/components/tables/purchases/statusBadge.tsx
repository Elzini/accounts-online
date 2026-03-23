import { Badge } from '@/components/ui/badge';

export function getStatusBadge(status: string, language: string, t?: any) {
  const normalized = String(status || '').trim().toLowerCase();
  switch (normalized) {
    case 'available':
      return <Badge className="bg-success hover:bg-success/90 text-xs">{t?.status_available || (language === 'ar' ? 'متاح' : 'Available')}</Badge>;
    case 'transferred':
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">{t?.status_transferred || (language === 'ar' ? 'محول' : 'Transferred')}</Badge>;
    case 'sold':
      return <Badge variant="secondary" className="text-xs">{t?.status_sold || (language === 'ar' ? 'مباع' : 'Sold')}</Badge>;
    case 'approved':
    case 'issued':
    case 'معتمدة':
    case 'معتمد':
      return <Badge className="bg-success hover:bg-success/90 text-xs">{language === 'ar' ? 'معتمدة' : 'Approved'}</Badge>;
    case 'draft':
    case 'مسودة':
      return <Badge variant="secondary" className="text-xs">{language === 'ar' ? 'مسودة' : 'Draft'}</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}
