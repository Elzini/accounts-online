import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  code: string;
  name: string;
}

interface AccountSearchSelectProps {
  accounts: Account[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AccountSearchSelect({ accounts, value, onChange, placeholder = "اكتب الكود أو الاسم..." }: AccountSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedAccount = useMemo(() => 
    accounts.find(acc => acc.id === value), 
    [accounts, value]
  );

  useEffect(() => {
    if (selectedAccount && !open) {
      setSearch(`${selectedAccount.code} - ${selectedAccount.name}`);
    }
  }, [selectedAccount, open]);

  const filteredAccounts = useMemo(() => {
    if (!search || (selectedAccount && search === `${selectedAccount.code} - ${selectedAccount.name}`)) {
      return accounts;
    }
    const searchLower = search.toLowerCase();
    return accounts.filter(acc => 
      acc.code.toLowerCase().includes(searchLower) || 
      acc.name.toLowerCase().includes(searchLower)
    );
  }, [accounts, search, selectedAccount]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredAccounts.length]);

  useEffect(() => {
    if (open && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, open]);

  const handleSelect = (account: Account) => {
    onChange(account.id);
    setSearch(`${account.code} - ${account.name}`);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    setOpen(true);
    if (!newValue) {
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (open) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredAccounts.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredAccounts[highlightedIndex]) {
            handleSelect(filteredAccounts[highlightedIndex]);
          }
          break;
        case 'Escape':
          setOpen(false);
          if (selectedAccount) {
            setSearch(`${selectedAccount.code} - ${selectedAccount.name}`);
          }
          break;
        case 'Tab':
          if (filteredAccounts[highlightedIndex]) {
            handleSelect(filteredAccounts[highlightedIndex]);
          }
          setOpen(false);
          break;
      }
    }
  };

  const handleFocus = () => {
    setOpen(true);
    inputRef.current?.select();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if clicking inside our own dropdown
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
      return;
    }
    setTimeout(() => {
      setOpen(false);
      if (selectedAccount) {
        setSearch(`${selectedAccount.code} - ${selectedAccount.name}`);
      } else {
        setSearch('');
      }
    }, 150);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (selectedAccount) {
          setSearch(`${selectedAccount.code} - ${selectedAccount.name}`);
        } else {
          setSearch('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, selectedAccount]);

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={search}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full text-sm min-w-[220px]"
        autoComplete="off"
      />
      {open && filteredAccounts.length > 0 && (
        <div 
          ref={listRef}
          className="absolute top-full left-0 right-0 z-[99999] mt-1 max-h-[300px] overflow-y-auto rounded-md border bg-popover shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filteredAccounts.map((account, index) => (
            <div
              key={account.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(account); }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors",
                index === highlightedIndex 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              <span className="font-mono text-xs opacity-70 min-w-[60px]">{account.code}</span>
              <span className="flex-1 truncate">{account.name}</span>
            </div>
          ))}
        </div>
      )}
      {open && filteredAccounts.length === 0 && search && (
        <div 
          className="absolute top-full left-0 right-0 z-[99999] mt-1 rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-lg"
        >
          لا توجد نتائج
        </div>
      )}
    </div>
  );
}
