import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-3", className)} aria-label="Alucard Institute home">
      <span className="relative grid h-10 w-10 place-items-center rounded-full border border-gold/60 transition-transform duration-500 group-hover:rotate-[20deg]">
        <svg viewBox="0 0 32 32" className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M16 3 L28 28 H4 Z" />
          <path d="M10 20 H22" />
          <circle cx="16" cy="13" r="1.6" fill="currentColor" />
        </svg>
      </span>
      <span className="leading-none">
        <span className={cn("block font-display text-lg font-semibold tracking-[0.18em]", tone === "light" ? "text-night-foreground" : "text-foreground")}>
          ALUCARD
        </span>
        <span className="block text-[0.6rem] font-semibold tracking-[0.5em] text-gold">INSTITUTE</span>
      </span>
    </Link>
  );
}
