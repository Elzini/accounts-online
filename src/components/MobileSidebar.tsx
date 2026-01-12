import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { ActivePage } from '@/types';

interface MobileSidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export function MobileSidebar({ activePage, setActivePage }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  const handlePageChange = (page: ActivePage) => {
    setActivePage(page);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-4 right-4 z-50 bg-card shadow-lg rounded-full w-12 h-12"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">فتح القائمة</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-72 border-none">
        <Sidebar activePage={activePage} setActivePage={handlePageChange} />
      </SheetContent>
    </Sheet>
  );
}
