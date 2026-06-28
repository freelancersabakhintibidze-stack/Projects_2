export function Spinner() {
  return (
    <div className="spinner-wrap" role="status" aria-label="Loading">
      <div className="spinner" />
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="error-box" role="alert">
      <span className="error-icon">⚠️</span>
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: {
  icon: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
