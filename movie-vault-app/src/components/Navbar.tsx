import { Link, useLocation } from "wouter";
import { useApp } from "../context/AppContext";

export function Navbar() {
  const [location] = useLocation();
  const { favorites, watchlist } = useApp();

  const links = [
    { href: "/", label: "Browse" },
    { href: "/favorites", label: "Favorites", badge: favorites.length },
    { href: "/watchlist", label: "Watchlist", badge: watchlist.length },
  ];

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <span className="brand-icon">🎬</span>
        <span className="brand-text">Movie Vault</span>
      </Link>
      <div className="navbar-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${location === link.href ? "active" : ""}`}
          >
            {link.label}
            {link.badge !== undefined && link.badge > 0 && (
              <span className="badge">{link.badge}</span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
