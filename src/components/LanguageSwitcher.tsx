import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n/types';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export function LanguageSwitcher({ variant = 'default' }: { variant?: 'default' | 'compact' | 'sidebar' }) {
  const { language, setLanguage } = useLanguage();

  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
        className="h-9 w-9"
      >
        <Globe className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
      >
        <Globe className="h-4 w-4" />
        <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        <span className="text-xs opacity-60 ms-auto">{current.flag}</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span>{current.flag} {current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? 'bg-accent' : ''}
          >
            <span className="me-2">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
