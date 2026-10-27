import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";

let instance: Lenis | null = null;

/** Buttery inertial page scrolling (Lenis). Disabled for visitors who prefer reduced motion. */
export function SmoothScroll() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    instance = lenis;
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });
    // In-page links (#section) glide instead of jumping.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("a[href^='#']") as HTMLAnchorElement | null;
      const id = a?.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); }
    };
    document.addEventListener("click", onClick);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("click", onClick); lenis.destroy(); instance = null; };
  }, []);

  // New page → start at the top.
  useEffect(() => { instance ? instance.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0); }, [pathname]);
  return null;
}
