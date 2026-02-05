// Pre-defined theme presets with colors and settings
export interface ThemePreset {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  colors: {
    primary: string;
    sidebar: string;
    accent: string;
    success: string;
    warning: string;
  };
  preview: {
    gradient: string;
  };
}

export const themePresets: ThemePreset[] = [
  // الثيمات الأصلية
  {
    id: 'royal-blue',
    name: 'أزرق ملكي',
    nameEn: 'Royal Blue',
    description: 'ثيم احترافي بألوان زرقاء كلاسيكية',
    colors: {
      primary: '#3b82f6',
      sidebar: '#1e3a5f',
      accent: '#60a5fa',
      success: '#10b981',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e3a5f 100%)',
    },
  },
  {
    id: 'emerald-green',
    name: 'أخضر زمردي',
    nameEn: 'Emerald Green',
    description: 'ثيم طبيعي مريح للعين',
    colors: {
      primary: '#10b981',
      sidebar: '#064e3b',
      accent: '#34d399',
      success: '#22c55e',
      warning: '#eab308',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
    },
  },
  {
    id: 'royal-purple',
    name: 'بنفسجي ملكي',
    nameEn: 'Royal Purple',
    description: 'ثيم أنيق وعصري',
    colors: {
      primary: '#8b5cf6',
      sidebar: '#4c1d95',
      accent: '#a78bfa',
      success: '#10b981',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)',
    },
  },
  {
    id: 'sunset-orange',
    name: 'برتقالي دافئ',
    nameEn: 'Sunset Orange',
    description: 'ثيم دافئ ومفعم بالطاقة',
    colors: {
      primary: '#f97316',
      sidebar: '#7c2d12',
      accent: '#fb923c',
      success: '#22c55e',
      warning: '#eab308',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #f97316 0%, #7c2d12 100%)',
    },
  },
  {
    id: 'ocean-teal',
    name: 'تركوازي بحري',
    nameEn: 'Ocean Teal',
    description: 'ثيم هادئ كالمحيط',
    colors: {
      primary: '#14b8a6',
      sidebar: '#134e4a',
      accent: '#2dd4bf',
      success: '#10b981',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #134e4a 100%)',
    },
  },
  {
    id: 'rose-pink',
    name: 'وردي أنيق',
    nameEn: 'Rose Pink',
    description: 'ثيم ناعم وأنيق',
    colors: {
      primary: '#ec4899',
      sidebar: '#831843',
      accent: '#f472b6',
      success: '#10b981',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #ec4899 0%, #831843 100%)',
    },
  },
  {
    id: 'golden-amber',
    name: 'ذهبي فاخر',
    nameEn: 'Golden Amber',
    description: 'ثيم فخم بألوان ذهبية',
    colors: {
      primary: '#d97706',
      sidebar: '#451a03',
      accent: '#fbbf24',
      success: '#22c55e',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #d97706 0%, #451a03 100%)',
    },
  },
  {
    id: 'slate-dark',
    name: 'رمادي داكن',
    nameEn: 'Slate Dark',
    description: 'ثيم احترافي محايد',
    colors: {
      primary: '#64748b',
      sidebar: '#1e293b',
      accent: '#94a3b8',
      success: '#10b981',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #64748b 0%, #1e293b 100%)',
    },
  },
  // ===== ثيمات جديدة =====
  {
    id: 'midnight-indigo',
    name: 'نيلي منتصف الليل',
    nameEn: 'Midnight Indigo',
    description: 'ثيم ليلي غامض وأنيق',
    colors: {
      primary: '#6366f1',
      sidebar: '#1e1b4b',
      accent: '#818cf8',
      success: '#22c55e',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #6366f1 0%, #1e1b4b 100%)',
    },
  },
  {
    id: 'cherry-red',
    name: 'أحمر كرزي',
    nameEn: 'Cherry Red',
    description: 'ثيم جريء ومميز',
    colors: {
      primary: '#ef4444',
      sidebar: '#7f1d1d',
      accent: '#f87171',
      success: '#10b981',
      warning: '#fbbf24',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)',
    },
  },
  {
    id: 'forest-sage',
    name: 'أخضر حكيم',
    nameEn: 'Forest Sage',
    description: 'ثيم طبيعي هادئ',
    colors: {
      primary: '#84cc16',
      sidebar: '#365314',
      accent: '#a3e635',
      success: '#22c55e',
      warning: '#eab308',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #84cc16 0%, #365314 100%)',
    },
  },
  {
    id: 'sky-cyan',
    name: 'سماوي صافي',
    nameEn: 'Sky Cyan',
    description: 'ثيم منعش كالسماء',
    colors: {
      primary: '#06b6d4',
      sidebar: '#164e63',
      accent: '#22d3ee',
      success: '#10b981',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #164e63 100%)',
    },
  },
  {
    id: 'lavender-dream',
    name: 'لافندر حالم',
    nameEn: 'Lavender Dream',
    description: 'ثيم رومانسي ناعم',
    colors: {
      primary: '#a855f7',
      sidebar: '#581c87',
      accent: '#c084fc',
      success: '#22c55e',
      warning: '#fbbf24',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #a855f7 0%, #581c87 100%)',
    },
  },
  {
    id: 'coral-sunset',
    name: 'مرجاني غروب',
    nameEn: 'Coral Sunset',
    description: 'ثيم دافئ رومانسي',
    colors: {
      primary: '#fb7185',
      sidebar: '#9f1239',
      accent: '#fda4af',
      success: '#10b981',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #fb7185 0%, #9f1239 100%)',
    },
  },
  {
    id: 'mocha-brown',
    name: 'بني موكا',
    nameEn: 'Mocha Brown',
    description: 'ثيم دافئ كلاسيكي',
    colors: {
      primary: '#a16207',
      sidebar: '#422006',
      accent: '#ca8a04',
      success: '#22c55e',
      warning: '#fbbf24',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #a16207 0%, #422006 100%)',
    },
  },
  {
    id: 'arctic-frost',
    name: 'جليد قطبي',
    nameEn: 'Arctic Frost',
    description: 'ثيم بارد ومنعش',
    colors: {
      primary: '#38bdf8',
      sidebar: '#0c4a6e',
      accent: '#7dd3fc',
      success: '#22c55e',
      warning: '#f59e0b',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #38bdf8 0%, #0c4a6e 100%)',
    },
  },
];

export const getThemeById = (id: string): ThemePreset | undefined => {
  return themePresets.find((theme) => theme.id === id);
};
