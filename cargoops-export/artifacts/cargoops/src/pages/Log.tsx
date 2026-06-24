import { useState, useMemo } from "react";
import { useCargo } from "../store/CargoContext";
import { Trash2, Search, Download, X } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  "Order Added": "text-blue-600 dark:text-blue-400",
  "Order Updated": "text-sky-600 dark:text-sky-400",
  "Order Deleted": "text-red-600 dark:text-red-400",
  "Order Duplicated": "text-indigo-600 dark:text-indigo-400",
  "Order Confirmed": "text-emerald-600 dark:text-emerald-400",
  "Order Cancelled": "text-gray-500 dark:text-gray-400",
  "Order Reopened": "text-amber-600 dark:text-amber-400",
  "Driver Selected": "text-purple-600 dark:text-purple-400",
  "Driver Added": "text-teal-600 dark:text-teal-400",
  "Driver Updated": "text-cyan-600 dark:text-cyan-400",
  "Driver Deleted": "text-red-500 dark:text-red-400",
  "Driver Status Changed": "text-amber-600 dark:text-amber-400",
  "Offer Added": "text-green-600 dark:text-green-400",
  "Offer Deleted": "text-orange-600 dark:text-orange-400",
  "System": "text-muted-foreground",
};

export function Log() {
  const { logEntries, clearLog } = useCargo();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return logEntries;
    return logEntries.filter(e =>
      e.action.toLowerCase().includes(s) ||
      e.details.toLowerCase().includes(s) ||
      e.timestamp.includes(s)
    );
  }, [logEntries, search]);

  function downloadLog() {
    const content = logEntries
      .map(e => `[${e.timestamp}] ${e.action}${e.details ? ": " + e.details : ""}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cargo_log_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logEntries.forEach(e => { counts[e.action] = (counts[e.action] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [logEntries]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Operational Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{logEntries.length} entries recorded</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadLog}
            disabled={logEntries.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={15} /> Export .txt
          </button>
          <button
            onClick={() => { if (confirm("Clear all log entries? This cannot be undone.")) clearLog(); }}
            disabled={logEntries.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/50 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={15} /> Clear
          </button>
        </div>
      </div>

      {/* Top actions summary */}
      {actionCounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actionCounts.map(([action, count]) => (
            <button
              key={action}
              onClick={() => setSearch(action)}
              className="px-3 py-1 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
            >
              {action}: <span className="font-bold">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-8 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search log entries… (action, details, time)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Log entries */}
      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium">
              {logEntries.length === 0 ? "No log entries yet." : "No entries match your search."}
            </p>
            <p className="text-sm mt-1">
              {logEntries.length === 0 ? "Actions you perform will be recorded here automatically." : ""}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-card-border max-h-[65vh] overflow-y-auto">
              {filtered.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-muted/10 transition-colors"
                >
                  <span className="flex-shrink-0 font-mono text-xs text-muted-foreground tabular-nums mt-0.5 min-w-[148px]">
                    {entry.timestamp}
                  </span>
                  <div className="min-w-0">
                    <span className={`font-semibold text-sm ${ACTION_COLORS[entry.action] ?? ""}`}>
                      {entry.action}
                    </span>
                    {entry.details && (
                      <span className="text-sm text-muted-foreground ml-2">— {entry.details}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-2.5 border-t border-card-border text-xs text-muted-foreground flex justify-between">
              <span>Showing {filtered.length} of {logEntries.length} entries · newest first</span>
              {search && <button onClick={() => setSearch("")} className="text-primary hover:underline">Clear search</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
