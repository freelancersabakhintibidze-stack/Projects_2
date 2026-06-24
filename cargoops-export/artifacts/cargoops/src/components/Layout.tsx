import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useCargo } from "../store/CargoContext";
import { cn } from "../lib/utils";
import {
  LayoutDashboard, ClipboardList, Truck, DollarSign,
  ScrollText, FileDown, Moon, Sun, RotateCcw, Trash2
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/drivers", label: "Drivers", icon: Truck },
  { href: "/offers", label: "Offers", icon: DollarSign },
  { href: "/log", label: "Log", icon: ScrollText },
  { href: "/report", label: "Report", icon: FileDown },
];

export function Layout({ children }: { children: ReactNode }) {
  const { darkMode, setDarkMode, resetToDemo, clearAllData } = useCargo();
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground border-b border-sidebar-border shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14 gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-2xl">🚛</span>
            <span className="font-bold text-lg tracking-tight text-white">CargoOps</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    location === href
                      ? "bg-sidebar-primary text-white"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon size={15} />
                  {label}
                </button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => { if (confirm("Restore all demo data?")) resetToDemo(); }}
              className="p-2 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              title="Reload demo data"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => { if (confirm("Clear all data and start fresh?")) clearAllData(); }}
              className="p-2 rounded-md text-sidebar-foreground/70 hover:bg-red-800 hover:text-white transition-colors"
              title="Clear all data"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <nav className="md:hidden sticky top-14 z-30 bg-sidebar text-sidebar-foreground border-b border-sidebar-border overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2 min-w-max">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                  location === href
                    ? "bg-sidebar-primary text-white"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            </Link>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border text-center text-xs text-muted-foreground py-3">
        CargoOps — Local Cargo Order Management · All data stored in browser localStorage
      </footer>
    </div>
  );
}
