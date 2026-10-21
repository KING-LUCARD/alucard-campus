import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { nav } from "@/lib/site";
import { useScrolled } from "@/components/motion";
import { cn } from "@/lib/utils";

export function Header() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "bg-night/85 py-3 shadow-elegant backdrop-blur-xl" : "bg-transparent py-6",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="relative text-sm font-medium text-night-foreground/80 transition-colors hover:text-night-foreground"
              activeProps={{ className: "!text-gold" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <span className="rounded-full border border-night-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-night-muted" title="Portals arrive in the next stage">
            Portal sign-in · soon
          </span>
          <Link to="/admissions" className="rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-gold transition-transform hover:-translate-y-0.5">
            Apply now
          </Link>
        </div>
        <button aria-label="Toggle menu" onClick={() => setOpen((o) => !o)} className="text-night-foreground lg:hidden">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-night lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {nav.map((n, i) => (
                <motion.div key={n.to} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <Link to={n.to} onClick={() => setOpen(false)} className="block py-3 font-display text-2xl text-night-foreground">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
