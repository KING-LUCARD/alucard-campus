import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { ArrowUpRight, BookOpen, Cpu, FlaskConical, Languages, Palette, Sigma, CalendarDays } from "lucide-react";
import { CountUp, ProgressBar, Stagger, StaggerItem } from "@/components/motion";
import { SectionTitle } from "./PageHero";
import { articles, formatDate, programs, stats, type Article } from "@/lib/site";

const icons = { BookOpen, Cpu, FlaskConical, Languages, Palette, Sigma };

export function StatsBand() {
  return (
    <section className="grain relative overflow-hidden bg-gradient-night py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionTitle tone="dark" eyebrow="By the numbers" title="A community built on rigour" intro="Sample figures shown for illustration — to be replaced with verified school data." />
        <Stagger className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" gap={0.15}>
          {stats.map((s) => (
            <StaggerItem key={s.label} variant="scaleUp" className="rounded-2xl border border-night-border bg-night-2/60 p-8 backdrop-blur">
              <CountUp to={s.value} suffix={s.suffix} className="font-display text-6xl font-light text-gradient-gold" />
              <p className="mt-3 text-sm uppercase tracking-widest text-night-muted">{s.label}</p>
              <ProgressBar pct={s.pct} className="mt-6" />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function ProgramGrid() {
  return (
    <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" gap={0.08}>
      {programs.map((p, i) => {
        const Icon = icons[p.icon];
        return (
          <StaggerItem key={p.title} variant={i % 2 ? "fadeUp" : "scaleUp"}>
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-elegant"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 transition-transform duration-700 group-hover:scale-[2.5]" />
              <motion.div whileHover={{ rotate: -8, scale: 1.1 }} className="relative grid h-14 w-14 place-items-center rounded-xl bg-primary text-gold">
                <Icon className="h-6 w-6" />
              </motion.div>
              <h3 className="relative mt-6 text-2xl">{p.title}</h3>
              <p className="relative mt-3 text-muted-foreground">{p.desc}</p>
              <span className="relative mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                Explore <ArrowUpRight className="h-4 w-4" />
              </span>
            </motion.div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

export function ArticleCard({ a }: { a: Article }) {
  return (
    <Link to="/news/$slug" params={{ slug: a.slug }} className="group block h-full">
      <motion.article
        whileHover={{ y: -6 }}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-elegant"
      >
        <div className="aspect-[16/10] overflow-hidden"><img src={a.image} alt={a.alt} loading="lazy" width={1280} height={832} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
        <div className="flex flex-1 flex-col p-7">
        <div className="flex items-center justify-between text-xs">
          <span className="rounded-full bg-secondary px-3 py-1 font-semibold uppercase tracking-wider text-primary">{a.category}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(a.date)}
          </span>
        </div>
        <h3 className="mt-5 text-xl leading-snug transition-colors group-hover:text-primary">{a.title}</h3>
        <p className="mt-3 flex-1 text-sm text-muted-foreground">{a.excerpt}</p>
        <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold">
          Read more <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
        </div>
      </motion.article>
    </Link>
  );
}

export function LatestNews({ category }: { category?: Article["category"] }) {
  const list = articles.filter((a) => (category ? a.category === category : a.category !== "Event")).slice(0, 3);
  return (
    <Stagger className="grid gap-6 md:grid-cols-3" gap={0.12}>
      {list.map((a) => (
        <StaggerItem key={a.slug}>
          <ArticleCard a={a} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** Horizontal gallery driven by vertical scroll. */
export function ScrollGallery({ items }: { items: { src: string; title: string; text: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${(items.length - 1) * 70}vw`]);
  if (reduce) {
    return (
      <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2">
        {items.map((it) => <GalleryCard key={it.title} {...it} />)}
      </div>
    );
  }
  return (
    <div ref={ref} style={{ height: `${items.length * 80}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-8 pl-6 md:pl-[10vw]">
          {items.map((it) => (
            <div key={it.title} className="w-[80vw] shrink-0 md:w-[62vw]">
              <GalleryCard {...it} />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function GalleryCard({ src, title, text }: { src: string; title: string; text: string }) {
  return (
    <div className="group relative aspect-[16/10] overflow-hidden rounded-3xl">
      <img src={src} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
      <div className="absolute inset-0 bg-veil" />
      <div className="absolute bottom-0 p-8 md:p-12">
        <h3 className="text-3xl text-night-foreground md:text-5xl">{title}</h3>
        <p className="mt-3 max-w-md text-night-muted">{text}</p>
      </div>
    </div>
  );
}
