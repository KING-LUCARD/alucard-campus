import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { nav } from "@/lib/site";
import { useScrolled } from "@/components/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSchoolAuth } from "@/components/SchoolAuth";

export function Header() {
  const { user, signOut } = useSchoolAuth();
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
        <nav className="hidden items-center gap-5 xl:flex">
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
        <div className="hidden items-center gap-3 xl:flex">
          <Button asChild variant="outline"><Link to={user ? '/account' : '/auth'}>{user ? 'My account' : 'Log In'}</Link></Button>
          {!user && <Button asChild className="bg-gradient-gold text-accent-foreground"><Link to="/auth" search={{ mode: 'register' }}>Sign Up</Link></Button>}
          {user && <Button variant="ghost" className="text-night-foreground" onClick={() => void signOut()}>Sign out</Button>}
        </div>
        <Button variant="ghost" size="icon" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="text-night-foreground xl:hidden">
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-h-[calc(100svh-90px)] overflow-y-auto bg-night xl:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              <Button asChild variant="outline"><Link to={user ? '/account' : '/auth'} onClick={() => setOpen(false)}>{user ? 'My account' : 'Log In'}</Link></Button>
              {!user && <Button asChild className="mt-2 bg-gradient-gold text-accent-foreground"><Link to="/auth" search={{ mode: 'register' }} onClick={() => setOpen(false)}>Sign Up</Link></Button>}
              {user && <Button variant="ghost" className="mt-2 text-night-foreground" onClick={() => { setOpen(false); void signOut(); }}>Sign out</Button>}
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
