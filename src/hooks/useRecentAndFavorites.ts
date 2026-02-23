import { useState, useCallback, useEffect } from 'react';
import { ActivePage } from '@/types';

const RECENT_KEY = 'launcher_recent_pages';
const FAVORITES_KEY = 'launcher_favorite_pages';
const MAX_RECENT = 8;

export interface RecentItem {
  id: ActivePage;
  label: string;
  labelEn: string;
  timestamp: number;
}

export function useRecentAndFavorites() {
  const [recentPages, setRecentPages] = useState<RecentItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch { return []; }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch { return []; }
  });

  const addRecent = useCallback((id: ActivePage, label: string, labelEn: string) => {
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      const updated = [{ id, label, labelEn, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { recentPages, favorites, addRecent, toggleFavorite, isFavorite };
}
