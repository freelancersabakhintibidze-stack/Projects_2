import { Link } from "wouter";
import { useApp } from "../context/AppContext";
import type { Movie } from "../types/movie";

interface Props {
  movie: Movie;
}

export function MovieCard({ movie }: Props) {
  const { isFavorite, toggleFavorite, isInWatchlist, addToWatchlist } = useApp();
  const fav = isFavorite(movie.id);
  const inWl = isInWatchlist(movie.id);

  return (
    <div className="movie-card">
      <Link href={`/movie/${movie.id}`} className="card-link">
        <div className="card-poster-wrap">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="card-poster"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "";
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = "flex";
              }}
            />
          ) : null}
          <div className="card-poster-placeholder" style={{ display: movie.poster ? "none" : "flex" }}>
            <span>🎬</span>
          </div>
          {movie.rating && (
            <div className="card-rating">
              <span className="star">★</span> {movie.rating.toFixed(1)}
            </div>
          )}
          {movie.genres.length > 0 && (
            <div className="card-genre">{movie.genres[0]}</div>
          )}
        </div>
        <div className="card-body">
          <h3 className="card-title">{movie.title}</h3>
          <span className="card-year">{movie.year}</span>
        </div>
      </Link>
      <div className="card-actions">
        <button
          className={`action-btn fav-btn ${fav ? "active" : ""}`}
          onClick={() => toggleFavorite(movie)}
          title={fav ? "Remove from favorites" : "Add to favorites"}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        >
          {fav ? "♥" : "♡"} {fav ? "Saved" : "Favorite"}
        </button>
        <button
          className={`action-btn wl-btn ${inWl ? "active" : ""}`}
          onClick={() => !inWl && addToWatchlist(movie)}
          title={inWl ? "In watchlist" : "Add to watchlist"}
          aria-label={inWl ? "In watchlist" : "Add to watchlist"}
          disabled={inWl}
        >
          {inWl ? "✓ Added" : "+ Watchlist"}
        </button>
      </div>
    </div>
  );
}
