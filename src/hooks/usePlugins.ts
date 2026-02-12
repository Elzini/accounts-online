import { useState, useCallback, useEffect } from 'react';

export interface PluginInfo {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  version: string;
  author: string;
  category: 'accounting' | 'hr' | 'inventory' | 'reports' | 'integrations' | 'utilities';
  icon: string;
  installed: boolean;
  enabled: boolean;
  rating: number;
  downloads: number;
  pageId: string; // maps to ActivePage
  menuLabel: string;
  menuLabel_en: string;
  menuIcon: string; // lucide icon key
}

const STORAGE_KEY = 'elzini_installed_plugins';

export const ALL_PLUGINS: PluginInfo[] = [
  {
    id: 'zatca-phase2',
    name: 'الفوترة الإلكترونية ZATCA',
    name_en: 'ZATCA E-Invoicing',
    description: 'الامتثال الكامل لمتطلبات هيئة الزكاة والضريبة والجمارك - المرحلة الثانية',
    description_en: 'Full compliance with ZATCA Phase 2 requirements',
    version: '2.1.0',
    author: 'Elzini',
    category: 'accounting',
    icon: '🧾',
    installed: true,
    enabled: true,
    rating: 4.9,
    downloads: 1250,
    pageId: 'plugin-zatca',
    menuLabel: 'الفوترة الإلكترونية',
    menuLabel_en: 'E-Invoicing',
    menuIcon: 'receipt',
  },
  {
    id: 'advanced-hr',
    name: 'الموارد البشرية المتقدمة',
    name_en: 'Advanced HR',
    description: 'إدارة شاملة للموارد البشرية تشمل التأمينات والتقييم والتدريب',
    description_en: 'Comprehensive HR management with insurance, evaluation and training',
    version: '1.5.0',
    author: 'Elzini',
    category: 'hr',
    icon: '👥',
    installed: true,
    enabled: true,
    rating: 4.7,
    downloads: 890,
    pageId: 'plugin-advanced-hr',
    menuLabel: 'الموارد البشرية المتقدمة',
    menuLabel_en: 'Advanced HR',
    menuIcon: 'users',
  },
  {
    id: 'multi-warehouse',
    name: 'المستودعات المتعددة',
    name_en: 'Multi-Warehouse',
    description: 'إدارة مخزون متعددة المواقع مع تتبع التحويلات والجرد',
    description_en: 'Multi-location inventory with transfer tracking and stocktake',
    version: '1.3.0',
    author: 'Elzini',
    category: 'inventory',
    icon: '🏭',
    installed: true,
    enabled: true,
    rating: 4.8,
    downloads: 720,
    pageId: 'plugin-multi-warehouse',
    menuLabel: 'المستودعات المتعددة',
    menuLabel_en: 'Multi-Warehouse',
    menuIcon: 'warehouse',
  },
  {
    id: 'bi-analytics',
    name: 'تحليلات الأعمال BI',
    name_en: 'Business Intelligence',
    description: 'لوحات تحليل متقدمة مع مخططات تفاعلية وتقارير ذكية',
    description_en: 'Advanced analytics dashboards with interactive charts and smart reports',
    version: '1.2.0',
    author: 'Elzini',
    category: 'reports',
    icon: '📊',
    installed: false,
    enabled: false,
    rating: 4.6,
    downloads: 560,
    pageId: 'plugin-bi-analytics',
    menuLabel: 'تحليلات الأعمال BI',
    menuLabel_en: 'BI Analytics',
    menuIcon: 'bar-chart-3',
  },
  {
    id: 'pos-system',
    name: 'نقاط البيع POS',
    name_en: 'Point of Sale',
    description: 'نظام نقاط بيع متكامل مع دعم الباركود والطابعات الحرارية',
    description_en: 'Integrated POS system with barcode and thermal printer support',
    version: '1.0.0',
    author: 'Elzini',
    category: 'utilities',
    icon: '🖥️',
    installed: false,
    enabled: false,
    rating: 4.5,
    downloads: 340,
    pageId: 'plugin-pos',
    menuLabel: 'نقاط البيع POS',
    menuLabel_en: 'POS System',
    menuIcon: 'monitor',
  },
  {
    id: 'whatsapp-integration',
    name: 'تكامل واتساب',
    name_en: 'WhatsApp Integration',
    description: 'إرسال الفواتير والتقارير عبر واتساب تلقائياً',
    description_en: 'Auto-send invoices and reports via WhatsApp',
    version: '1.1.0',
    author: 'Elzini Partners',
    category: 'integrations',
    icon: '💬',
    installed: false,
    enabled: false,
    rating: 4.4,
    downloads: 430,
    pageId: 'plugin-whatsapp',
    menuLabel: 'تكامل واتساب',
    menuLabel_en: 'WhatsApp Integration',
    menuIcon: 'message-circle',
  },
  {
    id: 'ifrs-compliance',
    name: 'معايير IFRS الدولية',
    name_en: 'IFRS Compliance',
    description: 'الامتثال لمعايير المحاسبة الدولية IFRS مع التقارير المطلوبة',
    description_en: 'International Financial Reporting Standards compliance',
    version: '1.0.0',
    author: 'Elzini',
    category: 'accounting',
    icon: '🌍',
    installed: false,
    enabled: false,
    rating: 4.3,
    downloads: 210,
    pageId: 'plugin-ifrs',
    menuLabel: 'معايير IFRS',
    menuLabel_en: 'IFRS Standards',
    menuIcon: 'globe',
  },
  {
    id: 'project-management',
    name: 'إدارة المشاريع المتقدمة',
    name_en: 'Advanced Project Management',
    description: 'إدارة المشاريع مع Gantt Charts وتتبع الموارد والتكاليف',
    description_en: 'Project management with Gantt Charts, resource and cost tracking',
    version: '1.4.0',
    author: 'Elzini',
    category: 'utilities',
    icon: '📋',
    installed: false,
    enabled: false,
    rating: 4.7,
    downloads: 380,
    pageId: 'plugin-project-mgmt',
    menuLabel: 'إدارة المشاريع',
    menuLabel_en: 'Project Management',
    menuIcon: 'clipboard-list',
  },
];

function loadInstalledState(): Record<string, { installed: boolean; enabled: boolean }> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveInstalledState(state: Record<string, { installed: boolean; enabled: boolean }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function usePlugins() {
  const [pluginStates, setPluginStates] = useState<Record<string, { installed: boolean; enabled: boolean }>>(() => loadInstalledState());

  // Merge default plugin data with persisted states
  const plugins: PluginInfo[] = ALL_PLUGINS.map(p => {
    const saved = pluginStates[p.id];
    if (saved) {
      return { ...p, installed: saved.installed, enabled: saved.enabled };
    }
    return p;
  });

  const installedPlugins = plugins.filter(p => p.installed);
  const activePlugins = plugins.filter(p => p.installed && p.enabled);
  const availablePlugins = plugins.filter(p => !p.installed);

  const installPlugin = useCallback((pluginId: string) => {
    setPluginStates(prev => {
      const next = { ...prev, [pluginId]: { installed: true, enabled: true } };
      saveInstalledState(next);
      return next;
    });
  }, []);

  const uninstallPlugin = useCallback((pluginId: string) => {
    setPluginStates(prev => {
      const next = { ...prev, [pluginId]: { installed: false, enabled: false } };
      saveInstalledState(next);
      return next;
    });
  }, []);

  const togglePlugin = useCallback((pluginId: string, enabled: boolean) => {
    setPluginStates(prev => {
      const next = { ...prev, [pluginId]: { installed: true, enabled } };
      saveInstalledState(next);
      return next;
    });
  }, []);

  return { plugins, installedPlugins, activePlugins, availablePlugins, installPlugin, uninstallPlugin, togglePlugin };
}
