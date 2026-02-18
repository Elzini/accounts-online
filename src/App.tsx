import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import { FiscalYearProvider } from "@/contexts/FiscalYearContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NetworkStatusIndicator } from "@/components/pwa/NetworkStatusIndicator";
import { useCartSync } from "@/hooks/useCartSync";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import Index from "./pages/Index";
import AuthChoice from "./pages/AuthChoice";
import Auth from "./pages/Auth";
import SuperAdminAuth from "./pages/SuperAdminAuth";
import Register from "./pages/Register";
import Companies from "./pages/Companies";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import RamadanGreeting from "./pages/RamadanGreeting";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes - avoid redundant refetches
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      retry: 1, // Only retry once on failure
    },
  },
});

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}

// Route for company users only (not super_admin without company)
function CompanyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { companyId, isSuperAdmin, loading: companyLoading } = useCompany();

  if (authLoading || companyLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth/company" replace />;
  }

  // Super admin without a company should go to /companies
  if (isSuperAdmin && !companyId) {
    return <Navigate to="/companies" replace />;
  }

  // Regular user without company (shouldn't happen but handle it)
  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive font-bold mb-2">لا توجد شركة مرتبطة بحسابك</p>
          <p className="text-muted-foreground">يرجى التواصل مع مدير النظام</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Route for super admin only
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, permissions } = useAuth();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth/super-admin" replace />;
  }

  if (!permissions.super_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, permissions } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();

  if (authLoading || companyLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    // Super admin without company goes to /companies
    if (permissions.super_admin && !companyId) {
      return <Navigate to="/companies" replace />;
    }
    // Regular users or super admin with company go to dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  useCartSync();
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <CompanyRoute>
            <Index />
          </CompanyRoute>
        } 
      />
      <Route 
        path="/companies" 
        element={
          <SuperAdminRoute>
            <Companies />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <AuthChoice />
          </PublicRoute>
        } 
      />
      <Route 
        path="/auth/company" 
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } 
      />
      <Route 
        path="/auth/super-admin" 
        element={
          <PublicRoute>
            <SuperAdminAuth />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route path="/install" element={<Install />} />
      <Route path="/ramadan" element={<RamadanGreeting />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <CompanyProvider>
            <FiscalYearProvider>
              <ThemeProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <NetworkStatusIndicator />
                    <UpdatePrompt />
                    <InstallBanner />
                    <AppRoutes />
                  </BrowserRouter>
                </TooltipProvider>
              </ThemeProvider>
            </FiscalYearProvider>
          </CompanyProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
