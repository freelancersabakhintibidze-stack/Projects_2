import { Link } from "wouter";

export default function NotFound() {
  return (
    <main className="page not-found-page">
      <div className="not-found-content">
        <div className="not-found-icon">🎬</div>
        <h1>404</h1>
        <h2>Page not found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <Link href="/" className="btn-primary">Back to Browse</Link>
      </div>
    </main>
  );
}
