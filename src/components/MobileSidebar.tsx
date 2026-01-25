import { useState, forwardRef, useImperativeHandle } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { ActivePage } from '@/types';

interface MobileSidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export interface MobileSidebarRef {
  open: () => void;
  close: () => void;
}

export const MobileSidebar = forwardRef<MobileSidebarRef, MobileSidebarProps>(
  ({ activePage, setActivePage }, ref) => {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }));

    const handlePageChange = (page: ActivePage) => {
      setActivePage(page);
      setOpen(false);
    };

    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed top-3 right-3 z-50 bg-card/95 backdrop-blur-sm shadow-md rounded-xl w-10 h-10 sm:w-11 sm:h-11 border-border hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">فتح القائمة</span>
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="p-0 w-[280px] sm:w-[300px] border-none overflow-y-auto overscroll-contain"
        >
          <Sidebar activePage={activePage} setActivePage={handlePageChange} />
        </SheetContent>
      </Sheet>
    );
  }
);

MobileSidebar.displayName = 'MobileSidebar';

