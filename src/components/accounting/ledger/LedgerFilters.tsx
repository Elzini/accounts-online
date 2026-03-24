/**
 * General Ledger - Filters Card
 * Extracted from GeneralLedgerPage.tsx
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { FileText, CalendarIcon, Search, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LedgerFiltersProps {
  accounts: any[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  t: any;
  getAccountTypeLabel: (type: string) => string;
}

export function LedgerFilters({ accounts, selectedAccountId, setSelectedAccountId, dateRange, setDateRange, t, getAccountTypeLabel }: LedgerFiltersProps) {
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const filteredAccounts = useMemo(() => {
    if (!accountSearch) return accounts;
    const query = accountSearch.toLowerCase();
    return accounts.filter(acc => acc.name.toLowerCase().includes(query) || acc.code.toLowerCase().includes(query));
  }, [accounts, accountSearch]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t.gl_select_account}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-0 sm:min-w-[300px]">
            <Popover open={showAccountDropdown && filteredAccounts.length > 0} onOpenChange={setShowAccountDropdown}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    placeholder={t.gl_search_placeholder}
                    value={accountSearch}
                    onChange={(e) => { setAccountSearch(e.target.value); setShowAccountDropdown(true); }}
                    onFocus={() => setShowAccountDropdown(true)}
                    className="pr-10"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command>
                  <CommandList>
                    <CommandEmpty>{t.gl_no_results}</CommandEmpty>
                    <CommandGroup heading={t.gl_matching_accounts}>
                      <ScrollArea className="h-[250px]">
                        {filteredAccounts.slice(0, 20).map((account) => (
                          <CommandItem
                            key={account.id}
                            value={account.id}
                            onSelect={() => {
                              setSelectedAccountId(account.id);
                              setAccountSearch(`${account.code} - ${account.name}`);
                              setShowAccountDropdown(false);
                            }}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground">{account.code}</span>
                              <span>{account.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{getAccountTypeLabel(account.type)}</Badge>
                              {selectedAccountId === account.id && <Check className="w-4 h-4 text-primary" />}
                            </div>
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <div className="flex gap-2 mt-2 flex-wrap">
              {['assets', 'liabilities', 'equity', 'revenue', 'expenses'].map((type) => (
                <Button key={type} variant="outline" size="sm" className="text-xs" onClick={() => { setAccountSearch(getAccountTypeLabel(type)); setShowAccountDropdown(true); }}>
                  {getAccountTypeLabel(type)}
                </Button>
              ))}
              {accountSearch && (
                <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => { setAccountSearch(''); setSelectedAccountId(null); }}>
                  {t.gl_clear}
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "yyyy/MM/dd") : t.gl_from}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRange.from} onSelect={(date) => setDateRange({ ...dateRange, from: date })} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "yyyy/MM/dd") : t.gl_to}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRange.to} onSelect={(date) => setDateRange({ ...dateRange, to: date })} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
