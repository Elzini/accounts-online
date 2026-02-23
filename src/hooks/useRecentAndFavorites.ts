import { useState, useCallback, useMemo } from 'react';
import { ActivePage } from '@/types';

const RECENT_KEY = 'launcher_recent_pages';
const FAVORITES_KEY = 'launcher_favorite_pages';
const FREQUENCY_KEY = 'launcher_page_frequency';
const MAX_RECENT = 8;
const MAX_SUGGESTIONS = 4;

export interface RecentItem {
  id: ActivePage;
  label: string;
  labelEn: string;
  timestamp: number;
}

interface FrequencyEntry {
  id: ActivePage;
  label: string;
  labelEn: string;
  count: number;
  lastUsed: number;
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

  const [frequency, setFrequency] = useState<FrequencyEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FREQUENCY_KEY) || '[]');
    } catch { return []; }
  });

  const addRecent = useCallback((id: ActivePage, label: string, labelEn: string) => {
    // Update recent
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      const updated = [{ id, label, labelEn, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });

    // Update frequency
    setFrequency(prev => {
      const existing = prev.find(f => f.id === id);
      let updated: FrequencyEntry[];
      if (existing) {
        updated = prev.map(f => f.id === id ? { ...f, count: f.count + 1, lastUsed: Date.now(), label, labelEn } : f);
      } else {
        updated = [...prev, { id, label, labelEn, count: 1, lastUsed: Date.now() }];
      }
      localStorage.setItem(FREQUENCY_KEY, JSON.stringify(updated));
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

  // Smart suggestions: most frequently used pages that aren't already in favorites
  const suggestions = useMemo(() => {
    const favSet = new Set(favorites);
    return [...frequency]
      .filter(f => !favSet.has(f.id) && f.count >= 3)
      .sort((a, b) => {
        // Score = frequency * recency weight
        const recencyA = 1 / (1 + (Date.now() - a.lastUsed) / (1000 * 60 * 60 * 24));
        const recencyB = 1 / (1 + (Date.now() - b.lastUsed) / (1000 * 60 * 60 * 24));
        return (b.count * recencyB) - (a.count * recencyA);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [frequency, favorites]);

  return { recentPages, favorites, addRecent, toggleFavorite, isFavorite, suggestions };
}
