import { useState, useCallback } from "react";
import type { Movie } from "../types/movie";

const STORAGE_KEY = "mv_favorites";

function load(): Movie[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Movie[]) : [];
  } catch {
    return [];
  }
}

function save(movies: Movie[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Movie[]>(load);

  const isFavorite = useCallback(
    (id: number) => favorites.some((m) => m.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((movie: Movie) => {
    setFavorites((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      const next = exists ? prev.filter((m) => m.id !== movie.id) : [...prev, movie];
      save(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = prev.filter((m) => m.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
