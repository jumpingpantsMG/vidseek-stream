import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Clapperboard, Code2, Menu, Search, Play } from "lucide-react";

type Props = {
  children: ReactNode;
  onSearch?: (q: string) => void;
  query?: string;
  setQuery?: (q: string) => void;
};

export function AppShell({ children, onSearch, query = "", setQuery }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background px-4">
        <button aria-label="Menu" className="rounded-full p-2 hover:bg-accent">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-1.5 font-semibold tracking-tight">
          <span className="grid h-6 w-9 place-items-center rounded-md bg-brand text-brand-foreground">
            <Play className="h-3.5 w-3.5 fill-current" />
          </span>
          <span className="text-lg">TubeSearch</span>
        </Link>

        <form
          className="mx-auto hidden w-full max-w-2xl items-center sm:flex"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch?.(query.trim());
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery?.(e.target.value)}
            placeholder="Search"
            className="h-10 w-full rounded-l-full border border-border bg-card px-4 text-sm outline-none focus:border-ring"
          />
          <button
            type="submit"
            aria-label="Search"
            className="grid h-10 w-16 place-items-center rounded-r-full border border-l-0 border-border bg-secondary hover:bg-accent"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <Link
          to="/api-docs"
          className="ml-auto rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          API
        </Link>
      </header>

      <div className="flex">
        <nav className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col gap-1 border-r border-border p-3 md:flex">
          <SideLink to="/" icon={<Home className="h-5 w-5" />} label="Home" />
          <SideLink to="/shorts" icon={<Clapperboard className="h-5 w-5" />} label="Shorts" />
          <SideLink to="/api-docs" icon={<Code2 className="h-5 w-5" />} label="API docs" />
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function SideLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-secondary" }}
      className="flex items-center gap-4 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
    >
      {icon}
      {label}
    </Link>
  );
}
