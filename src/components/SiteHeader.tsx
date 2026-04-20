import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const link = (to: string, label: string) => {
    const active = path === to;
    return (
      <Link
        to={to}
        className={`text-sm transition-colors ${
          active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="h-8 w-8 rounded-xl gradient-warm flex items-center justify-center shadow-warm">
            <Sparkles className="h-4 w-4 text-ink" strokeWidth={2.4} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            HireMate
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {link("/dashboard", "Dashboard")}
          {link("/onboarding", "New interview")}
          <Link
            to="/onboarding"
            className="hidden sm:inline-flex items-center rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Start practicing
          </Link>
        </nav>
      </div>
    </header>
  );
}
