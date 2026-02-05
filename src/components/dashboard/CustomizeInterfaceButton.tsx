import { useState } from 'react';
import { Settings, Palette, Sparkles, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActivePage } from '@/types';
import { DashboardCustomizer, CardConfig } from './DashboardCustomizer';

interface CustomizeInterfaceButtonProps {
  setActivePage: (page: ActivePage) => void;
  onCardsConfigChange?: (cards: CardConfig[]) => void;
}

export function CustomizeInterfaceButton({ setActivePage, onCardsConfigChange }: CustomizeInterfaceButtonProps) {
  const [customizerOpen, setCustomizerOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
          >
            <Settings className="w-4 h-4" />
            تخصيص الواجهة
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>خيارات التخصيص</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCustomizerOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-primary" />
            <div>
              <p className="font-medium">ترتيب البطاقات</p>
              <p className="text-xs text-muted-foreground">تحريك وتغيير حجم وألوان البطاقات</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setActivePage('theme-settings')}
            className="gap-2 cursor-pointer"
          >
            <Palette className="w-4 h-4 text-success" />
            <div>
              <p className="font-medium">الألوان والثيمات</p>
              <p className="text-xs text-muted-foreground">تغيير ألوان الواجهة</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setActivePage('control-center')}
            className="gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-warning" />
            <div>
              <p className="font-medium">التأثيرات المتقدمة</p>
              <p className="text-xs text-muted-foreground">مركز التحكم الشامل</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DashboardCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        onConfigChange={onCardsConfigChange}
      />
    </>
  );
}

