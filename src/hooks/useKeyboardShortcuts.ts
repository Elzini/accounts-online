import { useEffect } from 'react';
import { ActivePage } from '@/types';

interface ShortcutConfig {
  setActivePage: (page: ActivePage) => void;
  onOpenSearch: () => void;
  onBackToLauncher: () => void;
}

export function useKeyboardShortcuts({ setActivePage, onOpenSearch, onBackToLauncher }: ShortcutConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Cmd+K even in inputs
        if (!(e.key === 'k' && (e.metaKey || e.ctrlKey))) return;
      }

      // Cmd/Ctrl + K → Global Search
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      // Alt + shortcuts for quick navigation
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case 'h': case 'ر': // Home/Dashboard
            e.preventDefault();
            onBackToLauncher();
            break;
          case 'd': case 'ي': // Dashboard
            e.preventDefault();
            setActivePage('dashboard');
            break;
          case 's': case 'س': // Sales
            e.preventDefault();
            setActivePage('sales');
            break;
          case 'p': case 'ش': // Purchases
            e.preventDefault();
            setActivePage('purchases');
            break;
          case 'a': case 'ا': // Accounting (vouchers)
            e.preventDefault();
            setActivePage('vouchers');
            break;
          case 'e': case 'م': // Employees
            e.preventDefault();
            setActivePage('employees');
            break;
          case 'i': case 'ن': // Items/Inventory
            e.preventDefault();
            setActivePage('items-catalog');
            break;
          case 'c': case 'ع': // Customers
            e.preventDefault();
            setActivePage('customers');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActivePage, onOpenSearch, onBackToLauncher]);
}
