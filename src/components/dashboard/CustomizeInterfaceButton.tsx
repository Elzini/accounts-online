import { Settings, Palette, Sparkles, LayoutGrid, Edit3 } from 'lucide-react';
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
import { CardConfig } from './DashboardCustomizer';

interface CustomizeInterfaceButtonProps {
  setActivePage: (page: ActivePage) => void;
  onCardsConfigChange?: (cards: CardConfig[]) => void;
  onEnterEditMode?: () => void;
  isEditMode?: boolean;
}

export function CustomizeInterfaceButton({ 
  setActivePage, 
  onCardsConfigChange,
  onEnterEditMode,
  isEditMode 
}: CustomizeInterfaceButtonProps) {
  // If in edit mode, don't show the button
  if (isEditMode) return null;

  return (
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
          onClick={onEnterEditMode}
          className="gap-2 cursor-pointer"
        >
          <Edit3 className="w-4 h-4 text-primary" />
          <div>
            <p className="font-medium">تحرير لوحة التحكم</p>
            <p className="text-xs text-muted-foreground">سحب وإفلات وإخفاء الأقسام</p>
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
          onClick={() => setActivePage('theme-settings')}
          className="gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-warning" />
          <div>
            <p className="font-medium">التأثيرات المتقدمة</p>
            <p className="text-xs text-muted-foreground">الحركات والتأثيرات التفاعلية</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
