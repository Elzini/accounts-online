/**
 * Index Page - Thin Orchestrator
 * Route map extracted to src/pages/routeMap.tsx
 */
import { useState, useRef, useEffect } from 'react';
import { LogOut, Building2, Calendar, Eye, LayoutDashboard, Clock, Search } from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar, MobileSidebarRef } from '@/components/MobileSidebar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { SetupWizard } from '@/components/setup/SetupWizard';
import { FloatingMiniDashboard } from '@/components/dashboard/FloatingMiniDashboard';
import { useFocusMode, FocusModeOverlay } from '@/components/dashboard/FocusMode';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { CheckUpdateButton } from '@/components/pwa/CheckUpdateButton';
import { PushNotificationManager } from '@/components/pwa/PushNotificationManager';
import { OfflineDataIndicator } from '@/components/pwa/OfflineDataIndicator';
import { CarSearch } from '@/components/CarSearch';
import { FiscalYearSelectionDialog } from '@/components/FiscalYearSelectionDialog';
import { AIChatWidget } from '@/components/chat/AIChatWidget';
import { SupportContact } from '@/components/SupportContact';
import { FloatingQuickActions } from '@/components/FloatingQuickActions';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { GlobalSearchDialog } from '@/components/global-search/GlobalSearchDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useStats } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivePage } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { renderPageContent } from './routeMap';

const Index = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { data: stats, isLoading: isStatsLoading } = useStats();
  const { signOut, user, permissions } = useAuth();
  const { isSuperAdmin, viewAsCompanyId, setViewAsCompanyId, company: currentCompany } = useCompany();
  const { fiscalYears, selectedFiscalYear, setSelectedFiscalYear, isLoading: isFiscalYearLoading } = useFiscalYear();
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const { isFocusMode, toggleFocusMode, exitFocusMode } = useFocusMode();
  const industryFeatures = useIndustryFeatures();

  useEffect(() => {
    if (!isFiscalYearLoading && fiscalYears.length === 0 && currentCompany) {
      setShowSetupWizard(true);
    }
  }, [isFiscalYearLoading, fiscalYears, currentCompany]);

  useRealtimeNotifications();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['all-companies-selector'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  const mobileSidebarRef = useRef<MobileSidebarRef>(null);
  const mustSelectFiscalYear = !isFiscalYearLoading && fiscalYears.length > 0 && !selectedFiscalYear;

  const handleFiscalYearSelect = (fy: typeof fiscalYears[0]) => setSelectedFiscalYear(fy);

  const defaultStats = { 
    availableCars: 0, todaySales: 0, totalProfit: 0, monthSales: 0,
    totalPurchases: 0, monthSalesAmount: 0, totalGrossProfit: 0,
    totalCarExpenses: 0, totalGeneralExpenses: 0, purchasesCount: 0,
    monthSalesProfit: 0, totalSalesCount: 0, totalSalesAmount: 0,
  };

  const handleSetActivePage = (page: ActivePage) => setActivePage(page);

  const handleModuleSelect = (moduleId: string) => {
    if (moduleId === 'super_admin') { navigate('/companies'); return; }
    setActiveModule(moduleId);
    const firstPages: Record<string, ActivePage> = {
      sales: 'sales', purchases: 'purchases', accounting: 'vouchers',
      inventory: 'items-catalog', hr: 'employees', operations: 'work-orders',
      integrations: 'integrations', system: 'users-management',
      construction: 'projects', restaurant: 'menu-management',
      export_import: 'shipments', real_estate: 're-projects',
    };
    const firstPage = firstPages[moduleId];
    if (firstPage) setActivePage(firstPage);
  };

  const handleBackToLauncher = () => { setActivePage('dashboard'); setActiveModule(null); };
  const handleMenuClick = () => mobileSidebarRef.current?.open();

  useKeyboardShortcuts({
    setActivePage: handleSetActivePage,
    onOpenSearch: () => setShowGlobalSearch(true),
    onBackToLauncher: handleBackToLauncher,
  });

  return (
    <>
      {mustSelectFiscalYear && (
        <FiscalYearSelectionDialog open={true} fiscalYears={fiscalYears} currentSelectedId={selectedFiscalYear?.id} onSelect={handleFiscalYearSelect} />
      )}
      
      {showSetupWizard ? (
        <SetupWizard onComplete={() => setShowSetupWizard(false)} />
      ) : (
        <div className="flex min-h-screen min-h-[100dvh] bg-background">
          {!isFocusMode && (
            <div className="hidden lg:block shrink-0">
              <Sidebar activePage={activePage} setActivePage={handleSetActivePage} />
            </div>
          )}
          {!isFocusMode && <MobileSidebar ref={mobileSidebarRef} activePage={activePage} setActivePage={handleSetActivePage} />}
          
          <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pb-24 md:pb-4">
            {!isFocusMode && (
            <header className="sticky top-0 z-40 bg-background/98 backdrop-blur-lg border-b border-border/60 shadow-sm px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 safe-area-top">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Button variant="ghost" size="sm" onClick={handleBackToLauncher} className="gap-1.5 h-8 px-2 text-primary hover:bg-primary/10">
                    <LayoutDashboard className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">{t.nav_dashboard}</span>
                    {activePage !== 'dashboard' && (
                      <>
                        <span className="text-border">/</span>
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {activePage.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </>
                    )}
                  </div>
                  {isSuperAdmin && allCompanies.length > 0 && (
                    <Select value={viewAsCompanyId || 'default'} onValueChange={(val) => setViewAsCompanyId(val === 'default' ? null : val)}>
                      <SelectTrigger className="h-8 w-auto min-w-[140px] max-w-[220px] text-xs gap-1 border-primary/50 bg-primary/5">
                        <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
                        <SelectValue placeholder={t.view_as_company} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">{t.my_original_company}</SelectItem>
                        {allCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedFiscalYear && (
                    <Badge variant="outline" className="gap-1 shrink-0 text-xs" title="لتغيير السنة المالية، سجل خروج وأعد الدخول">
                      <Calendar className="w-3 h-3" />
                      <span className="hidden sm:inline">{selectedFiscalYear.name}</span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <CommandPalette setActivePage={handleSetActivePage} />
                  <Button variant="ghost" size="icon" onClick={() => setShowGlobalSearch(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground lg:hidden">
                    <Search className="w-4 h-4" />
                  </Button>
                  <NotificationsBell />
                  <div className="hidden sm:flex items-center gap-1">
                    <PushNotificationManager />
                    <OfflineDataIndicator />
                    {industryFeatures.hasCarInventory && <CarSearch />}
                  </div>
                  <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </header>
            )}
            
            {isFocusMode && <FocusModeOverlay onExit={exitFocusMode} />}
            
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              {renderPageContent({
                activePage,
                setActivePage: handleSetActivePage,
                stats: stats || defaultStats,
                isStatsLoading,
                isFocusMode,
                onToggleFocusMode: toggleFocusMode,
              })}
            </div>
          </main>

          {!isFocusMode && (
            <BottomNavigation activePage={activePage} setActivePage={handleSetActivePage} onMenuClick={handleMenuClick} />
          )}
          <AIChatWidget />
          <FloatingQuickActions setActivePage={handleSetActivePage} />
          <FloatingMiniDashboard isOnDashboard={activePage === 'dashboard'} />
        </div>
      )}

      <GlobalSearchDialog open={showGlobalSearch} onOpenChange={setShowGlobalSearch} setActivePage={handleSetActivePage} />
    </>
  );
};

export default Index;
