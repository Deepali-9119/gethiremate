import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-peach/40">
      <div className="max-w-6xl mx-auto px-5 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: logo + tagline */}
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="h-7 w-7 rounded-full gradient-warm grid place-items-center font-display text-xs font-semibold text-ink shadow-warm"
            >
              H
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-ink">HireMate</p>
              <p className="text-[11px] text-muted-foreground">Your AI interview coach</p>
            </div>
          </div>

          {/* Center: trust signals */}
          <p className="text-xs text-muted-foreground text-center order-last md:order-none">
            <span aria-hidden>🔒</span> Privacy-first
            <span className="mx-1.5 text-border">·</span>
            No data shared
            <span className="mx-1.5 text-border">·</span>
            Made in India <span aria-hidden>🇮🇳</span>
          </p>

          {/* Right: links */}
          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
          >
            <Link
              to="/"
              hash="about"
              className="hover:text-foreground transition"
            >
              About
            </Link>
            <Link
              to="/"
              hash="privacy"
              className="hover:text-foreground transition"
            >
              Privacy Policy
            </Link>
            <a
              href="mailto:hello@hiremate.app"
              className="hover:text-foreground transition"
            >
              Contact
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground transition"
            >
              Twitter / X
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground transition"
            >
              LinkedIn
            </a>
          </nav>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground/80 text-center md:text-left">
          © {new Date().getFullYear()} HireMate. Practice. Sharpen. Land the offer.
        </p>
      </div>
    </footer>
  );
}
