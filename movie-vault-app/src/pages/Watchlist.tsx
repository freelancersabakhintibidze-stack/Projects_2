import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useApp } from "../context/AppContext";
import { EmptyState } from "../components/Spinner";

export function Watchlist() {
  const { watchlist, removeFromWatchlist, toggleWatched } = useApp();
  const [filter, setFilter] = useState<"all" | "watched" | "unwatched">("all");

  const filtered = useMemo(() => {
    switch (filter) {
      case "watched": return watchlist.filter((w) => w.watched);
      case "unwatched": return watchlist.filter((w) => !w.watched);
      default: return [...watchlist];
    }
  }, [watchlist, filter]);

  const watchedCount = watchlist.filter((w) => w.watched).length;
  const unwatchedCount = watchlist.length - watchedCount;

  if (watchlist.length === 0) {
    return (
      <main className="page">
        <div className="page-header">
          <h1 className="page-title">My Watchlist</h1>
        </div>
        <EmptyState
          icon="📺"
          title="Your watchlist is empty"
          message="Add shows to track what you want to watch next."
          action={<Link href="/" className="btn-primary">Find Shows</Link>}
        />
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">My Watchlist <span className="count-badge">{watchlist.length}</span></h1>
        <div className="wl-stats">
          <span className="stat watched">✓ {watchedCount} watched</span>
          <span className="stat unwatched">◦ {unwatchedCount} to watch</span>
        </div>
      </div>

      <div className="wl-filter-tabs">
        {(["all", "unwatched", "watched"] as const).map((f) => (
          <button
            key={f}
            className={`tab-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "all" && ` (${watchlist.length})`}
            {f === "watched" && ` (${watchedCount})`}
            {f === "unwatched" && ` (${unwatchedCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={filter === "watched" ? "🎉" : "📋"}
          title={filter === "watched" ? "Nothing watched yet" : "All caught up!"}
          message={filter === "watched" ? "Mark shows as watched to see them here." : "You've watched everything in your list!"}
        />
      ) : (
        <div className="watchlist-items">
          {filtered.map(({ movie, watched, addedAt }) => (
            <div key={movie.id} className={`watchlist-item ${watched ? "is-watched" : ""}`}>
              <Link href={`/movie/${movie.id}`} className="wl-poster-link">
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} className="wl-poster" loading="lazy" />
                ) : (
                  <div className="wl-poster-placeholder">🎬</div>
                )}
              </Link>
              <div className="wl-info">
                <Link href={`/movie/${movie.id}`} className="wl-title">{movie.title}</Link>
                <div className="wl-meta">
                  <span>{movie.year}</span>
                  {movie.rating && <span>★ {movie.rating.toFixed(1)}</span>}
                  {movie.genres[0] && <span>{movie.genres[0]}</span>}
                </div>
                <div className="wl-added">Added {new Date(addedAt).toLocaleDateString()}</div>
              </div>
              <div className="wl-actions">
                <button
                  className={`toggle-watched-btn ${watched ? "watched-active" : ""}`}
                  onClick={() => toggleWatched(movie.id)}
                  title={watched ? "Mark as unwatched" : "Mark as watched"}
                >
                  {watched ? "✓ Watched" : "Mark Watched"}
                </button>
                <button
                  className="remove-wl-btn"
                  onClick={() => removeFromWatchlist(movie.id)}
                  title="Remove from watchlist"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {watchedCount === watchlist.length && watchlist.length > 0 && (
        <div className="congrats-banner">
          All caught up! You've watched everything on your list.
        </div>
      )}
    </main>
  );
}
