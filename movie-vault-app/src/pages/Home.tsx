import { useState, useEffect, useCallback, useMemo } from "react";
import { searchShows, getPopularShows } from "../services/tvmaze";
import type { Movie } from "../types/movie";
import { MovieCard } from "../components/MovieCard";
import { SearchBar } from "../components/SearchBar";
import { GenreFilter } from "../components/GenreFilter";
import { SortBar, type SortOption } from "../components/SortBar";
import { Spinner, ErrorMessage, EmptyState } from "../components/Spinner";

export function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState<SortOption>("default");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const fetchMovies = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    setPage(1);
    setGenre("");
    try {
      const data = q.trim() ? await searchShows(q) : await getPopularShows();
      setMovies(data);
    } catch {
      setError("Failed to load shows. Check your connection and try again.");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies("");
  }, [fetchMovies]);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      fetchMovies(q);
    },
    [fetchMovies]
  );

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [movies]);

  const sorted = useMemo(() => {
    let result = genre ? movies.filter((m) => m.genres.includes(genre)) : [...movies];
    switch (sort) {
      case "rating-desc":
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "rating-asc":
        result.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
        break;
      case "year-desc":
        result.sort((a, b) => (b.year === "N/A" ? -1 : parseInt(b.year)) - (a.year === "N/A" ? -1 : parseInt(a.year)));
        break;
      case "year-asc":
        result.sort((a, b) => (a.year === "N/A" ? Infinity : parseInt(a.year)) - (b.year === "N/A" ? Infinity : parseInt(b.year)));
        break;
      case "title-asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return result;
  }, [movies, genre, sort]);

  const paged = sorted.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < sorted.length;

  return (
    <main className="page home-page">
      <div className="home-hero">
        <h1 className="hero-title">Discover Shows</h1>
        <p className="hero-sub">Search millions of TV shows powered by TVMaze</p>
        <SearchBar onSearch={handleSearch} />
      </div>

      {!loading && !error && movies.length > 0 && (
        <div className="filter-row">
          <GenreFilter genres={allGenres} selected={genre} onSelect={(g) => { setGenre(g); setPage(1); }} />
          <SortBar value={sort} onChange={(s) => { setSort(s); setPage(1); }} />
        </div>
      )}

      {loading && <Spinner />}

      {!loading && error && (
        <ErrorMessage message={error} />
      )}

      {!loading && !error && sorted.length === 0 && movies.length > 0 && (
        <EmptyState
          icon="🎭"
          title="No shows in this genre"
          message="Try a different genre filter."
          action={<button className="btn-primary" onClick={() => setGenre("")}>Clear filter</button>}
        />
      )}

      {!loading && !error && movies.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No results found"
          message={query ? `No shows found for "${query}"` : "Start searching for your favorite shows."}
        />
      )}

      {!loading && !error && paged.length > 0 && (
        <>
          <div className="results-info">
            Showing {paged.length} of {sorted.length} results
            {genre && <span> in <strong>{genre}</strong></span>}
          </div>
          <div className="movie-grid">
            {paged.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
          {hasMore && (
            <div className="load-more-wrap">
              <button className="btn-outline" onClick={() => setPage((p) => p + 1)}>
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
