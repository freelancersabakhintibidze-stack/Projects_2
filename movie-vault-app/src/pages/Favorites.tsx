import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useApp } from "../context/AppContext";
import { EmptyState } from "../components/Spinner";
import { GenreFilter } from "../components/GenreFilter";
import { SortBar, type SortOption } from "../components/SortBar";

export function Favorites() {
  const { favorites, removeFavorite, isInWatchlist, addToWatchlist } = useApp();
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState<SortOption>("default");

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    favorites.forEach((m) => m.genres.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [favorites]);

  const sorted = useMemo(() => {
    let result = genre ? favorites.filter((m) => m.genres.includes(genre)) : [...favorites];
    switch (sort) {
      case "rating-desc": result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case "year-desc": result.sort((a, b) => parseInt(b.year) - parseInt(a.year)); break;
      case "year-asc": result.sort((a, b) => parseInt(a.year) - parseInt(b.year)); break;
      case "title-asc": result.sort((a, b) => a.title.localeCompare(b.title)); break;
    }
    return result;
  }, [favorites, genre, sort]);

  if (favorites.length === 0) {
    return (
      <main className="page">
        <div className="page-header">
          <h1 className="page-title">My Favorites</h1>
        </div>
        <EmptyState
          icon="♡"
          title="No favorites yet"
          message="Save shows you love by clicking the heart button."
          action={<Link href="/" className="btn-primary">Browse Shows</Link>}
        />
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">My Favorites <span className="count-badge">{favorites.length}</span></h1>
      </div>

      <div className="filter-row">
        <GenreFilter genres={allGenres} selected={genre} onSelect={setGenre} />
        <SortBar value={sort} onChange={setSort} />
      </div>

      <div className="movie-grid">
        {sorted.map((movie) => (
          <div key={movie.id} className="movie-card">
            <Link href={`/movie/${movie.id}`} className="card-link">
              <div className="card-poster-wrap">
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} className="card-poster" loading="lazy" />
                ) : (
                  <div className="card-poster-placeholder" style={{ display: "flex" }}><span>🎬</span></div>
                )}
                {movie.rating && (
                  <div className="card-rating"><span className="star">★</span> {movie.rating.toFixed(1)}</div>
                )}
              </div>
              <div className="card-body">
                <h3 className="card-title">{movie.title}</h3>
                <span className="card-year">{movie.year}</span>
              </div>
            </Link>
            <div className="card-actions">
              <button
                className="action-btn wl-btn"
                onClick={() => !isInWatchlist(movie.id) && addToWatchlist(movie)}
                disabled={isInWatchlist(movie.id)}
              >
                {isInWatchlist(movie.id) ? "✓ In Watchlist" : "+ Watchlist"}
              </button>
              <button
                className="action-btn fav-btn remove"
                onClick={() => removeFavorite(movie.id)}
              >
                ✕ Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && genre && (
        <EmptyState
          icon="🎭"
          title="No shows in this genre"
          message="Try a different genre filter."
          action={<button className="btn-primary" onClick={() => setGenre("")}>Clear filter</button>}
        />
      )}
    </main>
  );
}
