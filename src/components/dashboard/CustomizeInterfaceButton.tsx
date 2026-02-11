import { useState } from 'react';
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
import { DashboardCustomizer, CardConfig } from './DashboardCustomizer';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const { t } = useLanguage();

  if (isEditMode) return null;

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
            {t.customize_interface}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{t.customization_options}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onEnterEditMode} className="gap-2 cursor-pointer">
            <Edit3 className="w-4 h-4 text-primary" />
            <div>
              <p className="font-medium">{t.edit_dashboard}</p>
              <p className="text-xs text-muted-foreground">{t.drag_drop_sections}</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCustomizerOpen(true)} className="gap-2 cursor-pointer">
            <LayoutGrid className="w-4 h-4 text-success" />
            <div>
              <p className="font-medium">{t.arrange_cards}</p>
              <p className="text-xs text-muted-foreground">{t.move_resize_cards}</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActivePage('theme-settings')} className="gap-2 cursor-pointer">
            <Palette className="w-4 h-4 text-warning" />
            <div>
              <p className="font-medium">{t.colors_themes}</p>
              <p className="text-xs text-muted-foreground">{t.change_interface_colors}</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActivePage('theme-settings')} className="gap-2 cursor-pointer">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <div>
              <p className="font-medium">{t.advanced_effects}</p>
              <p className="text-xs text-muted-foreground">{t.animations_effects}</p>
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
