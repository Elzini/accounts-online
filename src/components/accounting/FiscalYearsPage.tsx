import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  useFiscalYears, 
  useCreateFiscalYear, 
  useCloseFiscalYear, 
  useOpenNewFiscalYear,
  useSetCurrentFiscalYear,
  useDeleteFiscalYear,
  useCarryForwardInventory,
  useRefreshAllCarryForward
} from '@/hooks/useFiscalYears';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Calendar, 
  Plus, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  Loader2,
  FileText,
  AlertTriangle,
  Package,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export function FiscalYearsPage() {
  const { t, direction } = useLanguage();
  const { data: fiscalYears = [], isLoading } = useFiscalYears();
  const { permissions } = useAuth();
  const isAdmin = permissions.admin || permissions.super_admin;
  
  const createFiscalYear = useCreateFiscalYear();
  const closeFiscalYear = useCloseFiscalYear();
  const openNewFiscalYear = useOpenNewFiscalYear();
  const setCurrentFiscalYear = useSetCurrentFiscalYear();
  const deleteFiscalYear = useDeleteFiscalYear();
  const carryForwardInventory = useCarryForwardInventory();
  const refreshAllCarryForward = useRefreshAllCarryForward();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isNewYearDialogOpen, setIsNewYearDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [isRefreshDialogOpen, setIsRefreshDialogOpen] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');
  const [newYearNotes, setNewYearNotes] = useState('');
  const [autoCarryForward, setAutoCarryForward] = useState(true);
  const [previousYearId, setPreviousYearId] = useState('');
  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');
  const [refreshFromYearId, setRefreshFromYearId] = useState('');
  const [refreshToYearId, setRefreshToYearId] = useState('');

  const currentYear = new Date().getFullYear();

  const handleCreateYear = () => {
    if (!newYearName || !newYearStart || !newYearEnd) return;
    createFiscalYear.mutate({
      name: newYearName, start_date: newYearStart, end_date: newYearEnd,
      is_current: fiscalYears.length === 0, notes: newYearNotes || undefined,
    }, { onSuccess: () => { setIsCreateDialogOpen(false); resetForm(); } });
  };

  const handleOpenNewYear = () => {
    if (!newYearName || !newYearStart || !newYearEnd) return;
    openNewFiscalYear.mutate({
      name: newYearName, startDate: newYearStart, endDate: newYearEnd,
      previousYearId: previousYearId || undefined, autoCarryForward,
    }, { onSuccess: () => { setIsNewYearDialogOpen(false); resetForm(); } });
  };

  const resetForm = () => {
    setNewYearName(''); setNewYearStart(''); setNewYearEnd(''); setNewYearNotes('');
    setAutoCarryForward(true); setPreviousYearId(''); setFromYearId(''); setToYearId('');
  };

  const handleCarryForwardInventory = () => {
    if (!fromYearId || !toYearId) return;
    carryForwardInventory.mutate({ fromFiscalYearId: fromYearId, toFiscalYearId: toYearId },
      { onSuccess: () => { setIsInventoryDialogOpen(false); setFromYearId(''); setToYearId(''); } });
  };

  const handleRefreshAllBalances = () => {
    if (!refreshFromYearId || !refreshToYearId) return;
    refreshAllCarryForward.mutate({ previousYearId: refreshFromYearId, fiscalYearId: refreshToYearId },
      { onSuccess: () => { setIsRefreshDialogOpen(false); setRefreshFromYearId(''); setRefreshToYearId(''); } });
  };

  const handleSetYearDefaults = (year: number) => {
    setNewYearName(year.toString()); setNewYearStart(`${year}-01-01`); setNewYearEnd(`${year}-12-31`);
  };

  const closedYears = fiscalYears.filter(y => y.status === 'closed');
  const openYears = fiscalYears.filter(y => y.status === 'open');

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.fy_title}</h1>
          <p className="text-muted-foreground">{t.fy_subtitle}</p>
        </div>
        <div className="flex gap-2">
          {/* Create fiscal year */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 ml-2" />{t.fy_create}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t.fy_create_title}</DialogTitle>
                <DialogDescription>{t.fy_create_desc}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2 mb-4">
                  {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                    <Button key={year} variant="outline" size="sm" onClick={() => handleSetYearDefaults(year)}>{year}</Button>
                  ))}
                </div>
                <div className="space-y-2"><Label>{t.fy_name_label}</Label><Input value={newYearName} onChange={(e) => setNewYearName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.fy_start_date}</Label><Input type="date" value={newYearStart} onChange={(e) => setNewYearStart(e.target.value)} /></div>
                  <div className="space-y-2"><Label>{t.fy_end_date}</Label><Input type="date" value={newYearEnd} onChange={(e) => setNewYearEnd(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>{t.fy_notes_optional}</Label><Textarea value={newYearNotes} onChange={(e) => setNewYearNotes(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{t.cancel}</Button>
                <Button onClick={handleCreateYear} disabled={createFiscalYear.isPending}>
                  {createFiscalYear.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}{t.fy_create}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Open new year with carry forward */}
          {closedYears.length > 0 && (
            <Dialog open={isNewYearDialogOpen} onOpenChange={setIsNewYearDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary"><ArrowRight className="h-4 w-4 ml-2" />{t.fy_open_and_carry}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.fy_open_new_title}</DialogTitle>
                  <DialogDescription>{t.fy_open_new_desc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2 mb-4">
                    {[currentYear, currentYear + 1].map(year => (
                      <Button key={year} variant="outline" size="sm" onClick={() => handleSetYearDefaults(year)}>{year}</Button>
                    ))}
                  </div>
                  <div className="space-y-2"><Label>{t.fy_new_name}</Label><Input value={newYearName} onChange={(e) => setNewYearName(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>{t.fy_start_date}</Label><Input type="date" value={newYearStart} onChange={(e) => setNewYearStart(e.target.value)} /></div>
                    <div className="space-y-2"><Label>{t.fy_end_date}</Label><Input type="date" value={newYearEnd} onChange={(e) => setNewYearEnd(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.fy_previous_year}</Label>
                    <Select value={previousYearId} onValueChange={setPreviousYearId}>
                      <SelectTrigger><SelectValue placeholder={t.fy_select_previous} /></SelectTrigger>
                      <SelectContent>{closedYears.map(year => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-base">{t.fy_auto_carry}</Label>
                      <p className="text-sm text-muted-foreground">{t.fy_auto_carry_desc}</p>
                    </div>
                    <Switch checked={autoCarryForward} onCheckedChange={setAutoCarryForward} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewYearDialogOpen(false)}>{t.cancel}</Button>
                  <Button onClick={handleOpenNewYear} disabled={openNewFiscalYear.isPending}>
                    {openNewFiscalYear.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}{t.fy_open_carry_btn}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Carry forward inventory */}
          {fiscalYears.length >= 2 && (
            <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Package className="h-4 w-4 ml-2" />{t.fy_carry_inventory}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.fy_carry_inventory_title}</DialogTitle>
                  <DialogDescription>{t.fy_carry_inventory_desc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t.fy_from_year}</Label>
                    <Select value={fromYearId} onValueChange={setFromYearId}>
                      <SelectTrigger><SelectValue placeholder={t.fy_select_source} /></SelectTrigger>
                      <SelectContent>
                        {fiscalYears.map(year => (
                          <SelectItem key={year.id} value={year.id} disabled={year.id === toYearId}>
                            {year.name} ({year.status === 'open' ? t.fy_status_open : t.fy_status_closed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-center"><ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" /></div>
                  <div className="space-y-2">
                    <Label>{t.fy_to_year}</Label>
                    <Select value={toYearId} onValueChange={setToYearId}>
                      <SelectTrigger><SelectValue placeholder={t.fy_select_target} /></SelectTrigger>
                      <SelectContent>
                        {fiscalYears.filter(y => y.status === 'open').map(year => (
                          <SelectItem key={year.id} value={year.id} disabled={year.id === fromYearId}>{year.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{t.fy_carry_warning}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInventoryDialogOpen(false)}>{t.cancel}</Button>
                  <Button onClick={handleCarryForwardInventory} disabled={carryForwardInventory.isPending || !fromYearId || !toYearId}>
                    {carryForwardInventory.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}{t.fy_carry_inventory}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Refresh carried balances */}
          {fiscalYears.length >= 2 && (
            <Dialog open={isRefreshDialogOpen} onOpenChange={setIsRefreshDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary"><RefreshCw className="h-4 w-4 ml-2" />{t.fy_refresh_balances}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.fy_refresh_title}</DialogTitle>
                  <DialogDescription>{t.fy_refresh_desc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t.fy_source_year}</Label>
                    <Select value={refreshFromYearId} onValueChange={setRefreshFromYearId}>
                      <SelectTrigger><SelectValue placeholder={t.fy_select_source} /></SelectTrigger>
                      <SelectContent>
                        {fiscalYears.map(year => (
                          <SelectItem key={year.id} value={year.id} disabled={year.id === refreshToYearId}>
                            {year.name} ({year.status === 'open' ? t.fy_status_open : t.fy_status_closed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-center"><ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" /></div>
                  <div className="space-y-2">
                    <Label>{t.fy_target_year}</Label>
                    <Select value={refreshToYearId} onValueChange={setRefreshToYearId}>
                      <SelectTrigger><SelectValue placeholder={t.fy_select_target} /></SelectTrigger>
                      <SelectContent>
                        {fiscalYears.filter(y => y.status === 'open').map(year => (
                          <SelectItem key={year.id} value={year.id} disabled={year.id === refreshFromYearId}>{year.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">{t.fy_will_update}</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>{t.fy_update_list_1}</li>
                      <li>{t.fy_update_list_2}</li>
                      <li>{t.fy_update_list_3}</li>
                    </ul>
                    <p className="text-sm text-destructive mt-2">{t.fy_update_warning}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRefreshDialogOpen(false)}>{t.cancel}</Button>
                  <Button onClick={handleRefreshAllBalances} disabled={refreshAllCarryForward.isPending || !refreshFromYearId || !refreshToYearId}>
                    {refreshAllCarryForward.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}{t.fy_update_balances}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Fiscal years list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.fy_title}
          </CardTitle>
          <CardDescription>
            {fiscalYears.length} {t.fy_count} ({openYears.length} {t.fy_status_open}، {closedYears.length} {t.fy_status_closed})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fiscalYears.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.fy_no_years}</h3>
              <p className="text-muted-foreground mb-4">{t.fy_no_years_desc}</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}><Plus className="h-4 w-4 ml-2" />{t.fy_create}</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.fy_col_year}</TableHead>
                  <TableHead>{t.fy_col_period}</TableHead>
                  <TableHead>{t.fy_col_status}</TableHead>
                  <TableHead>{t.fy_col_entries}</TableHead>
                  <TableHead>{t.fy_col_actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fiscalYears.map(year => (
                  <TableRow key={year.id} className={year.is_current ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{year.name}</span>
                        {year.is_current && (
                          <Badge variant="default" className="text-xs"><CheckCircle2 className="h-3 w-3 ml-1" />{t.fy_current}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(year.start_date), 'yyyy/MM/dd')} - {format(new Date(year.end_date), 'yyyy/MM/dd')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {year.status === 'open' ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50"><Unlock className="h-3 w-3 ml-1" />{t.fy_status_open}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50"><Lock className="h-3 w-3 ml-1" />{t.fy_status_closed}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {year.opening_balance_entry_id && (<Badge variant="secondary" className="text-xs"><FileText className="h-3 w-3 ml-1" />{t.fy_opening_entry}</Badge>)}
                        {year.closing_balance_entry_id && (<Badge variant="secondary" className="text-xs"><FileText className="h-3 w-3 ml-1" />{t.fy_closing_entry}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!year.is_current && year.status === 'open' && (
                          <Button variant="ghost" size="sm" onClick={() => setCurrentFiscalYear.mutate(year.id)} disabled={setCurrentFiscalYear.isPending}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {year.status === 'open' && isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-orange-600"><Lock className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-orange-500" />{t.fy_close_year}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.fy_close_year_desc}<br /><strong>{t.fy_close_year_note}</strong>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => closeFiscalYear.mutate(year.id)} className="bg-orange-600 hover:bg-orange-700">
                                  {closeFiscalYear.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Lock className="h-4 w-4 ml-2" />}{t.fy_close_btn}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {year.status === 'open' && !year.is_current && isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.fy_delete_year}</AlertDialogTitle>
                                <AlertDialogDescription>{t.fy_delete_year_desc}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteFiscalYear.mutate(year.id)} className="bg-destructive hover:bg-destructive/90">{t.delete}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t.fy_how_carry}</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>{t.fy_carry_auto}</strong> {t.fy_carry_auto_desc}</p>
            <p>• <strong>{t.fy_carry_revenue}</strong> {t.fy_carry_revenue_desc}</p>
            <p>• <strong>{t.fy_carry_manual}</strong> {t.fy_carry_manual_desc}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">{t.fy_permissions}</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>{t.fy_perm_open}</strong> {t.fy_perm_open_desc}</p>
            <p>• <strong>{t.fy_perm_closed}</strong> {t.fy_perm_closed_desc}</p>
            <p>• <strong>{t.fy_perm_reopen}</strong> {t.fy_perm_reopen_desc}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
