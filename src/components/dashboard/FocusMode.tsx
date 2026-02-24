import { useState, useEffect, useCallback } from 'react';
import { Focus, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const FOCUS_MODE_KEY = 'pref_focus_mode';

export function useFocusMode() {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev);
  }, []);

  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
  }, []);

  // Keyboard shortcut: Escape to exit focus mode
  useEffect(() => {
    if (!isFocusMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitFocusMode();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFocusMode, exitFocusMode]);

  return { isFocusMode, toggleFocusMode, exitFocusMode };
}

interface FocusModeToggleProps {
  isFocusMode: boolean;
  onToggle: () => void;
}

export function FocusModeToggle({ isFocusMode, onToggle }: FocusModeToggleProps) {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <Button
      variant={isFocusMode ? 'default' : 'ghost'}
      size="sm"
      onClick={onToggle}
      className={cn(
        'gap-1.5 h-8 text-xs transition-all',
        isFocusMode && 'bg-primary text-primary-foreground'
      )}
      title={isRtl ? 'وضع التركيز (إخفاء كل شيء عدا المحتوى)' : 'Focus Mode (hide everything except content)'}
    >
      <Focus className="w-3.5 h-3.5" />
      {isRtl ? 'تركيز' : 'Focus'}
    </Button>
  );
}

interface FocusModeOverlayProps {
  onExit: () => void;
}

export function FocusModeOverlay({ onExit }: FocusModeOverlayProps) {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <div className="fixed top-3 end-3 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
      <Button
        variant="secondary"
        size="sm"
        onClick={onExit}
        className="gap-1.5 h-8 text-xs shadow-lg border border-border/50 backdrop-blur-sm bg-background/90"
      >
        <X className="w-3.5 h-3.5" />
        {isRtl ? 'خروج من وضع التركيز' : 'Exit Focus'}
        <kbd className="text-[10px] px-1 py-0.5 bg-muted rounded font-mono ms-1">Esc</kbd>
      </Button>
    </div>
  );
}
