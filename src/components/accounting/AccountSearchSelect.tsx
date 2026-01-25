import { useState, useMemo, useRef, useEffect } from 'react';
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

  const selectedAccount = useMemo(() => 
    accounts.find(acc => acc.id === value), 
    [accounts, value]
  );

  // Set initial search value when account is selected
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

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredAccounts.length]);

  // Scroll highlighted item into view
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
    
    // If cleared, also clear the selected value
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
    // Select all text for easy replacement
    inputRef.current?.select();
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow click on list items
    setTimeout(() => {
      setOpen(false);
      if (selectedAccount) {
        setSearch(`${selectedAccount.code} - ${selectedAccount.name}`);
      } else {
        setSearch('');
      }
    }, 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={search}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full text-sm"
        autoComplete="off"
      />
      
      {open && filteredAccounts.length > 0 && (
        <div 
          ref={listRef}
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[200px] overflow-y-auto rounded-md border bg-popover shadow-lg"
        >
          {filteredAccounts.map((account, index) => (
            <div
              key={account.id}
              onClick={() => handleSelect(account)}
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
        <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-lg">
          لا توجد نتائج
        </div>
      )}
    </div>
  );
}
