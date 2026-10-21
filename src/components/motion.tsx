import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  animate,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export const variants = {
  fadeUp: { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } },
  fadeIn: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.9, ease } } },
  slideLeft: { hidden: { opacity: 0, x: -48 }, show: { opacity: 1, x: 0, transition: { duration: 0.9, ease } } },
  slideRight: { hidden: { opacity: 0, x: 48 }, show: { opacity: 1, x: 0, transition: { duration: 0.9, ease } } },
  scaleUp: { hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease } } },
} satisfies Record<string, Variants>;

type VariantName = keyof typeof variants;

function withDelay(v: Variants, delay: number): Variants {
  const show = v.show as { transition?: object };
  return { ...v, show: { ...(v.show as object), transition: { ...show.transition, delay } } } as Variants;
}

export function Reveal({
  children,
  variant = "fadeUp",
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  variant?: VariantName;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "span";
}) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  if (reduce) return <M className={className}>{children}</M>;
  return (
    <M
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={withDelay(variants[variant], delay)}
    >
      {children}
    </M>
  );
}

export function Stagger({ children, className, gap = 0.1 }: { children: ReactNode; className?: string; gap?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? undefined : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, variant = "fadeUp" }: { children: ReactNode; className?: string; variant?: VariantName }) {
  return (
    <motion.div className={className} variants={variants[variant]}>
      {children}
    </motion.div>
  );
}

/** Heading that reveals word by word from behind a mask. */
export function SplitHeading({
  text,
  className,
  as = "h2",
  delay = 0,
  immediate = false,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  delay?: number;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const words = text.split(" ");
  const trigger = immediate ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } };
  return (
    <Tag
      className={className}
      aria-label={text}
      initial={reduce ? undefined : "hidden"}
      {...(reduce ? {} : trigger)}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: delay } } }}
    >
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: "110%", rotate: 4 }, show: { y: "0%", rotate: 0, transition: { duration: 0.9, ease } } }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Image revealed through a clip-path mask, with gentle scroll parallax inside. */
export function ImageReveal({
  src,
  alt,
  className,
  direction = "up",
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  direction?: "up" | "left" | "right";
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const from = { up: "inset(100% 0 0 0)", left: "inset(0 100% 0 0)", right: "inset(0 0 0 100%)" }[direction];
  return (
    <motion.div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      initial={reduce ? undefined : { clipPath: from }}
      whileInView={reduce ? undefined : { clipPath: "inset(0 0 0 0)" }}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ duration: 1.2, ease }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        style={reduce ? undefined : { y, scale: 1.18 }}
        className="h-full w-full object-cover"
      />
    </motion.div>
  );
}

/** Wraps content that drifts at a different speed than the page. */
export function Parallax({ children, speed = 0.2, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}px`, `${-speed * 100}px`]);
  return (
    <motion.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}

export function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) return setVal(to);
    const c = animate(0, to, { duration: 2, ease, onUpdate: (v) => setVal(Math.round(v)) });
    return () => c.stop();
  }, [inView, to, reduce]);
  return (
    <span ref={ref} className={className}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={cn("h-1 w-full overflow-hidden rounded-full bg-night-border", className)}>
      <motion.div
        className="h-full origin-left rounded-full bg-gradient-gold"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: pct / 100 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease, delay: 0.2 }}
      />
    </div>
  );
}

/** Top-of-page reading progress, linked to scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-gold" />;
}

export function useScrolled(threshold = 40) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > threshold));
  return scrolled;
}

export { motion, useScroll, useTransform, useReducedMotion };
