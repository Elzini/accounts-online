import { Settings, Palette, Sparkles } from 'lucide-react';
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

interface CustomizeInterfaceButtonProps {
  setActivePage: (page: ActivePage) => void;
}

export function CustomizeInterfaceButton({ setActivePage }: CustomizeInterfaceButtonProps) {
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
          onClick={() => setActivePage('control-center')}
          className="gap-2 cursor-pointer"
        >
          <Palette className="w-4 h-4 text-primary" />
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
            <p className="font-medium">التأثيرات</p>
            <p className="text-xs text-muted-foreground">تأثيرات التحويم والحركة</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setActivePage('control-center')}
          className="gap-2 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-medium">القوائم والتنظيم</p>
            <p className="text-xs text-muted-foreground">ترتيب عناصر القائمة</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
