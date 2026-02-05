import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCompany } from './CompanyContext';
import { useMenuConfiguration } from '@/hooks/useSystemControl';

interface ThemeSettings {
  primaryColor: string;
  sidebarColor: string;
  fontFamily: string;
  fontSize: string;
}

interface ThemeContextType {
  themeSettings: ThemeSettings | null;
  isLoading: boolean;
}

const defaultTheme: ThemeSettings = {
  primaryColor: '#3b82f6',
  sidebarColor: '#1e293b',
  fontFamily: 'Cairo',
  fontSize: '16',
};

const ThemeContext = createContext<ThemeContextType>({
  themeSettings: null,
  isLoading: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

// Helper function to convert hex to HSL values
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '210 85% 45%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Generate lighter/darker variations
function generateColorVariations(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { light: '210 85% 55%', dark: '210 85% 35%' };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  
  return {
    light: `${hDeg} ${sPercent}% ${Math.min(Math.round(l * 100) + 10, 95)}%`,
    dark: `${hDeg} ${sPercent}% ${Math.max(Math.round(l * 100) - 10, 20)}%`,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { companyId } = useCompany();
  const { data: config, isLoading } = useMenuConfiguration();
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);

  useEffect(() => {
    if (config?.theme_settings && Object.keys(config.theme_settings).length > 0) {
      const settings = { ...defaultTheme, ...config.theme_settings };
      setThemeSettings(settings);
      applyTheme(settings);
    } else {
      setThemeSettings(defaultTheme);
      applyTheme(defaultTheme);
    }
  }, [config]);

  const applyTheme = (settings: ThemeSettings) => {
    const root = document.documentElement;
    
    // Apply primary color
    if (settings.primaryColor) {
      const primaryHsl = hexToHsl(settings.primaryColor);
      const variations = generateColorVariations(settings.primaryColor);
      
      root.style.setProperty('--primary', primaryHsl);
      root.style.setProperty('--ring', primaryHsl);
      root.style.setProperty('--accent', variations.light);
      
      // Also update sidebar primary
      root.style.setProperty('--sidebar-primary', primaryHsl);
      root.style.setProperty('--sidebar-ring', primaryHsl);
    }
    
    // Apply sidebar color
    if (settings.sidebarColor) {
      const sidebarHsl = hexToHsl(settings.sidebarColor);
      const sidebarVariations = generateColorVariations(settings.sidebarColor);
      
      root.style.setProperty('--sidebar-background', sidebarHsl);
      root.style.setProperty('--sidebar-accent', sidebarVariations.light);
      root.style.setProperty('--sidebar-border', sidebarVariations.dark);
      root.style.setProperty('--sidebar-foreground', '210 40% 98%');
      root.style.setProperty('--sidebar-accent-foreground', '210 40% 98%');
    }
    
    // Apply font family
    if (settings.fontFamily) {
      // Dynamically load the font if not Cairo
      if (settings.fontFamily !== 'Cairo') {
        const fontLink = document.getElementById('dynamic-font');
        const fontUrl = `https://fonts.googleapis.com/css2?family=${settings.fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
        
        if (fontLink) {
          (fontLink as HTMLLinkElement).href = fontUrl;
        } else {
          const link = document.createElement('link');
          link.id = 'dynamic-font';
          link.rel = 'stylesheet';
          link.href = fontUrl;
          document.head.appendChild(link);
        }
      }
      
      root.style.setProperty('--font-family', `'${settings.fontFamily}', sans-serif`);
      document.body.style.fontFamily = `'${settings.fontFamily}', sans-serif`;
    }
    
    // Apply font size
    if (settings.fontSize) {
      root.style.setProperty('--font-size-base', `${settings.fontSize}px`);
      root.style.fontSize = `${settings.fontSize}px`;
    }
  };

  return (
    <ThemeContext.Provider value={{ themeSettings, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}
