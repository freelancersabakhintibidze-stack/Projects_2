export interface Movie {
  id: number;
  title: string;
  year: string;
  poster: string;
  rating: number | null;
  genres: string[];
  summary: string;
  network?: string;
  status?: string;
  language?: string;
}

export interface WatchlistItem {
  movie: Movie;
  watched: boolean;
  addedAt: string;
}

export interface TvMazeSearchResult {
  score: number;
  show: TvMazeShow;
}

export interface TvMazeShow {
  id: number;
  name: string;
  premiered?: string;
  image?: { medium: string; original: string };
  rating?: { average: number | null };
  genres: string[];
  summary?: string;
  network?: { name: string };
  status?: string;
  language?: string;
}
