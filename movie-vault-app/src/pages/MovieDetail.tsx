import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { getShowById } from "../services/tvmaze";
import type { Movie } from "../types/movie";
import { useApp } from "../context/AppContext";
import { Spinner, ErrorMessage } from "../components/Spinner";

export function MovieDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = Number(params.id);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isFavorite, toggleFavorite, isInWatchlist, addToWatchlist } = useApp();

  useEffect(() => {
    if (!id || isNaN(id)) {
      setError("Invalid show ID.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getShowById(id)
      .then((m) => { if (!cancelled) setMovie(m); })
      .catch(() => { if (!cancelled) setError("Could not load show details."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="page"><Spinner /></div>;
  if (error) return <div className="page"><ErrorMessage message={error} /></div>;
  if (!movie) return null;

  const fav = isFavorite(movie.id);
  const inWl = isInWatchlist(movie.id);

  return (
    <main className="page detail-page">
      <button className="back-btn" onClick={() => navigate("/")}>← Back to Browse</button>

      <div className="detail-hero" style={{
        backgroundImage: movie.poster ? `url(${movie.poster.replace("medium", "original")})` : undefined
      }}>
        <div className="detail-overlay">
          <div className="detail-content">
            <div className="detail-poster-wrap">
              {movie.poster ? (
                <img src={movie.poster} alt={movie.title} className="detail-poster" />
              ) : (
                <div className="detail-poster-placeholder">🎬</div>
              )}
            </div>
            <div className="detail-info">
              <h1 className="detail-title">{movie.title}</h1>
              <div className="detail-meta">
                <span className="meta-year">{movie.year}</span>
                {movie.rating && (
                  <span className="meta-rating">★ {movie.rating.toFixed(1)}</span>
                )}
                {movie.status && (
                  <span className={`meta-status status-${movie.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {movie.status}
                  </span>
                )}
                {movie.language && <span className="meta-lang">{movie.language}</span>}
              </div>

              {movie.network && (
                <div className="detail-network">Network: <strong>{movie.network}</strong></div>
              )}

              {movie.genres.length > 0 && (
                <div className="detail-genres">
                  {movie.genres.map((g) => (
                    <span key={g} className="genre-tag">{g}</span>
                  ))}
                </div>
              )}

              {movie.summary && (
                <p className="detail-summary">{movie.summary}</p>
              )}

              <div className="detail-actions">
                <button
                  className={`btn-detail ${fav ? "btn-fav-active" : "btn-fav"}`}
                  onClick={() => toggleFavorite(movie)}
                >
                  {fav ? "♥ Remove Favorite" : "♡ Add to Favorites"}
                </button>
                <button
                  className={`btn-detail ${inWl ? "btn-wl-active" : "btn-wl"}`}
                  onClick={() => !inWl && addToWatchlist(movie)}
                  disabled={inWl}
                >
                  {inWl ? "✓ In Watchlist" : "+ Add to Watchlist"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
