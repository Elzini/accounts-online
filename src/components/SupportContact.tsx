import { Phone, Mail, MessageCircle, Headphones, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PHONE_NUMBER = '966542043061';
const EMAIL = 'elzini0@hotmail.com';
const WHATSAPP_URL = `https://wa.me/${PHONE_NUMBER}`;
const CALL_URL = `tel:+${PHONE_NUMBER}`;
const EMAIL_URL = `mailto:${encodeURIComponent(EMAIL)}`;

export function SupportContact() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  const channels = [
    {
      icon: MessageCircle,
      title: isRtl ? 'واتساب' : 'WhatsApp',
      description: isRtl ? 'تواصل معنا عبر واتساب للحصول على دعم فوري' : 'Chat with us on WhatsApp for instant support',
      action: isRtl ? 'فتح واتساب' : 'Open WhatsApp',
      href: WHATSAPP_URL,
      color: 'hsl(140,50%,45%)',
    },
    {
      icon: Phone,
      title: isRtl ? 'اتصال مباشر' : 'Direct Call',
      description: isRtl ? 'اتصل بنا مباشرة للتحدث مع فريق الدعم' : 'Call us directly to speak with our support team',
      action: isRtl ? 'اتصل الآن' : 'Call Now',
      href: CALL_URL,
      color: 'hsl(215,50%,45%)',
    },
    {
      icon: Mail,
      title: isRtl ? 'البريد الإلكتروني' : 'Email',
      description: isRtl ? 'أرسل لنا بريداً إلكترونياً وسنرد عليك في أقرب وقت' : 'Send us an email and we\'ll respond as soon as possible',
      action: isRtl ? 'إرسال بريد' : 'Send Email',
      href: EMAIL_URL,
      color: 'hsl(38,92%,50%)',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <Headphones className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {isRtl ? 'تواصل مع الدعم الفني' : 'Contact Technical Support'}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
          {isRtl
            ? 'فريق الدعم الفني متاح لمساعدتك. اختر وسيلة التواصل المناسبة لك'
            : 'Our support team is available to help you. Choose your preferred contact method'}
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {channels.map((channel) => (
          <a
            key={channel.title}
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-card rounded-xl border border-border p-6 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
              style={{ backgroundColor: channel.color }}
            >
              <channel.icon className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground text-lg">{channel.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{channel.description}</p>
            </div>
            <button
              className="mt-auto rounded-full px-6 py-2.5 text-sm font-semibold text-white flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: channel.color }}
            >
              {channel.action}
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </a>
        ))}
      </div>

      {/* Contact Info Summary */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-4 text-center">
          {isRtl ? 'معلومات التواصل' : 'Contact Information'}
        </h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <span dir="ltr">+{PHONE_NUMBER}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span dir="ltr">{EMAIL}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
