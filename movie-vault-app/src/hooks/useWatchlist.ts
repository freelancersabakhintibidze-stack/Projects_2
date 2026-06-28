import { useState, useCallback } from "react";
import type { Movie, WatchlistItem } from "../types/movie";

const STORAGE_KEY = "mv_watchlist";

function load(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchlistItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: WatchlistItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(load);

  const isInWatchlist = useCallback(
    (id: number) => watchlist.some((w) => w.movie.id === id),
    [watchlist]
  );

  const addToWatchlist = useCallback((movie: Movie) => {
    setWatchlist((prev) => {
      if (prev.some((w) => w.movie.id === movie.id)) return prev;
      const next: WatchlistItem[] = [
        ...prev,
        { movie, watched: false, addedAt: new Date().toISOString() },
      ];
      save(next);
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((id: number) => {
    setWatchlist((prev) => {
      const next = prev.filter((w) => w.movie.id !== id);
      save(next);
      return next;
    });
  }, []);

  const toggleWatched = useCallback((id: number) => {
    setWatchlist((prev) => {
      const next = prev.map((w) =>
        w.movie.id === id ? { ...w, watched: !w.watched } : w
      );
      save(next);
      return next;
    });
  }, []);

  return { watchlist, isInWatchlist, addToWatchlist, removeFromWatchlist, toggleWatched };
}
