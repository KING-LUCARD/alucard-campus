import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { nav, school } from "@/lib/site";
import { Reveal } from "@/components/motion";

export function Footer() {
  return (
    <footer className="grain overflow-hidden bg-night text-night-foreground">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <Reveal className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-6 max-w-sm text-night-muted">{school.tagline}</p>
            <p className="mt-4 font-display italic text-gold">{school.motto}</p>
          </div>
          <div>
            <p className="eyebrow">Explore</p>
            <ul className="mt-4 space-y-2">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="text-night-muted transition-colors hover:text-gold">{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Contact</p>
            <ul className="mt-4 space-y-2 text-sm text-night-muted">
              <li>{school.address}</li>
              <li><a href={`tel:${school.phone}`} className="hover:text-gold">{school.phone}</a></li>
              <li className="break-words"><a href={`mailto:${school.email}`} className="hover:text-gold">{school.email}</a></li>
            </ul>
          </div>
        </Reveal>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-night-border pt-8 text-xs text-night-muted md:flex-row">
          <p>© {new Date().getFullYear()} Alucard Institute. All rights reserved.</p>
          <p>Statistics, testimonials, and articles shown are sample content.</p>
        </div>
      </div>
    </footer>
  );
}
