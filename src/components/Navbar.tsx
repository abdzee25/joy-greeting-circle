import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/user", label: "User" },
  { to: "/admin", label: "Admin" },
  { to: "/client", label: "Client" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/30 bg-[#0A1628]/70 backdrop-blur-xl shadow-[0_4px_30px_-10px_rgba(59,130,246,0.45)]">
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary-glow to-transparent" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl btn-glow text-white animate-heartbeat">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-gradient">HealthGuard AI</span>
            <span className="text-[10px] uppercase tracking-wider text-primary-glow/70">SDG 3 · Vision 2030</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 transition-all hover:text-primary-glow hover:bg-primary/10"
              activeProps={{ className: "rounded-lg px-4 py-2 text-sm font-medium text-primary-glow bg-primary/15 shadow-[0_0_18px_-2px_rgba(96,165,250,0.7)] border border-primary/40" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-primary/15 hover:text-primary-glow"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-primary/20 bg-[#0A1628]/95 backdrop-blur-xl">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-foreground/70 hover:bg-primary/10 hover:text-primary-glow"
                activeProps={{ className: "rounded-lg px-4 py-3 text-sm font-medium bg-primary/15 text-primary-glow border border-primary/40" }}
                activeOptions={{ exact: true }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}