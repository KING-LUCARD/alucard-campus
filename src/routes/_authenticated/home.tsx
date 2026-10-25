import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { ArrowDown, Quote, Compass, Target, Mail, MapPin, Phone } from "lucide-react";
import hero from "@/assets/hero.jpg";
import library from "@/assets/library.jpg";
import lab from "@/assets/lab.jpg";
import students from "@/assets/students.jpg";
import { ImageReveal, Parallax, Reveal, SplitHeading, Stagger, StaggerItem } from "@/components/motion";
import { SectionTitle } from "@/components/site/PageHero";
import { LatestNews, ProgramGrid, ScrollGallery, StatsBand, ArticleCard } from "@/components/site/sections";
import { articles, school, testimonials } from "@/lib/site";
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute("/_authenticated/home")({
  head: () => pageHead('A School Where Inquiry Shapes the Future', 'Discover ALUCARD INSTITUTE in Lekki: knowledge, discipline, creativity and ambition for a changing world.'),
  component: Home,
});

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1.35]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[620px] overflow-hidden bg-night md:min-h-[680px]">
      <motion.img
        src={hero}
        alt="Alucard Institute campus at dusk"
        width={1920}
        height={1088}
        initial={reduce ? {} : { scale: 1.25, opacity: 0 }}
        animate={reduce ? {} : { scale: 1.08, opacity: 1 }}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
        style={reduce ? {} : { scale, y: imgY }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-veil" />
      <motion.div style={reduce ? {} : { y: textY, opacity: fade }} className="relative mx-auto flex max-w-7xl flex-col justify-end px-6 pb-24 pt-40 md:pt-48">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="eyebrow">
          {school.name} · LEKKI
        </motion.p>
        <SplitHeading
          as="h1"
          immediate
          delay={0.45}
          text="A School Where Inquiry Shapes the Future."
          className="mt-5 max-w-4xl text-4xl font-light leading-[1.1] text-night-foreground sm:text-6xl lg:text-7xl"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-8 max-w-xl text-lg text-night-muted"
        >
          Discover an environment where knowledge, discipline, creativity, and ambition prepare students for a changing world.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="mt-10 flex flex-wrap gap-4">
          <Button asChild size="lg" className="h-auto min-h-12 whitespace-normal bg-gradient-gold text-accent-foreground shadow-gold"><Link to="/admissions">Apply for Admission</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-auto min-h-12 whitespace-normal border-night-foreground/30 bg-night/30 text-night-foreground"><Link to="/academics">Explore Academics</Link></Button>
        </motion.div>
      </motion.div>
      <motion.a
        href="#welcome"
        aria-label="Scroll to continue"
        style={{ opacity: fade }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.3em] text-night-muted"
      >
        Scroll
        <motion.span animate={reduce ? {} : { y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <ArrowDown className="h-4 w-4 text-gold" />
        </motion.span>
      </motion.a>
    </section>
  );
}

function Home() {
  const events = articles.filter((a) => a.category === "Event");
  return (
    <>
      <Hero />

      {/* Welcome */}
      <section id="welcome" className="relative overflow-hidden py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="Welcome" title="An education with both depth and heart" />
            <Reveal delay={0.3}>
              <p className="mt-6 text-lg text-muted-foreground">
                At Alucard Institute, learning is a discipline and a delight. Our small classes, specialist teachers, and
                carefully designed curriculum help each student build knowledge that lasts — and the confidence to use it.
              </p>
            </Reveal>
            <Reveal delay={0.45}>
              <Link to="/about" className="mt-8 inline-flex border-b border-gold pb-1 font-semibold text-primary">Our story →</Link>
            </Reveal>
          </div>
          <div className="relative">
            <ImageReveal src={students} alt="Students on the campus lawn" width={1280} height={960} className="aspect-[4/3] rounded-3xl shadow-elegant" />
            <Parallax speed={0.4} className="absolute -bottom-10 -left-8 hidden w-56 md:block">
              <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-elegant">
                <p className="font-display text-4xl text-gold">1:12</p>
                <p className="mt-1 text-sm opacity-80">Teacher-to-student ratio (sample)</p>
              </div>
            </Parallax>
          </div>
        </div>
      </section>

      <StatsBand />

      {/* Mission & vision */}
      <section className="py-32">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-2">
          {[
            { icon: Target, t: "Our mission", d: "To cultivate disciplined, compassionate thinkers through rigorous scholarship, ethical leadership, and a love of learning." },
            { icon: Compass, t: "Our vision", d: "To be a beacon of educational excellence where every student discovers their purpose and the means to pursue it." },
          ].map((m, i) => (
            <Reveal key={m.t} variant={i ? "slideRight" : "slideLeft"} className="rounded-3xl border border-border bg-card p-10 md:p-14">
              <m.icon className="h-8 w-8 text-gold" />
              <h3 className="mt-6 text-3xl">{m.t}</h3>
              <p className="mt-4 text-lg text-muted-foreground">{m.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section className="bg-secondary/60 py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionTitle eyebrow="Academics" title="Programs that open doors" />
            <Reveal variant="fadeIn"><Link to="/academics" className="font-semibold text-primary">All programs →</Link></Reveal>
          </div>
          <div className="mt-14"><ProgramGrid /></div>
        </div>
      </section>

      {/* Principal */}
      <section className="grain relative overflow-hidden bg-night py-32 text-night-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-5">
          <ImageReveal src={library} alt="The Alucard library" direction="left" width={1280} height={960} className="aspect-[4/5] rounded-3xl lg:col-span-2" />
          <div className="lg:col-span-3">
            <p className="eyebrow">From the Principal</p>
            <Quote className="mt-6 h-10 w-10 text-gold" />
            <SplitHeading text="We teach students not what to think, but how to think well." className="mt-4 text-3xl font-light leading-snug md:text-5xl" />
            <Reveal delay={0.3}>
              <p className="mt-8 text-lg text-night-muted">
                Every family who joins us becomes part of a community that values effort, honesty, and wonder. I look
                forward to welcoming you to campus.
              </p>
              <p className="mt-6 font-display text-xl text-gold">The Principal</p>
              <p className="text-sm text-night-muted">Name to be added</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Facilities gallery */}
      <section className="bg-night pt-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionTitle tone="dark" eyebrow="Facilities" title="Spaces designed for discovery" />
        </div>
        <ScrollGallery
          items={[
            { src: lab, title: "Science laboratories", text: "Six modern labs for hands-on experimentation." },
            { src: library, title: "The great library", text: "Quiet study, research help, and thousands of volumes." },
            { src: hero, title: "Campus commons", text: "Open spaces where ideas meet." },
            { src: students, title: "Grounds & sport", text: "Fields and courts for team and individual sport." },
          ]}
        />
      </section>

      {/* Activities */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionTitle center eyebrow="Student life" title="Beyond the classroom" intro="Clubs, societies, and teams that build character and friendships." />
          <Stagger className="mt-14 flex flex-wrap justify-center gap-3" gap={0.05}>
            {["Debate Society", "Robotics Club", "Orchestra", "Model UN", "Football", "Drama", "Chess", "Coding Club", "Athletics", "Art Studio", "Community Service", "Science Olympiad"].map((a) => (
              <StaggerItem key={a} variant="scaleUp">
                <motion.span whileHover={{ scale: 1.06 }} className="inline-block cursor-default rounded-full border border-border bg-card px-6 py-3 font-medium transition-colors hover:border-gold hover:bg-primary hover:text-primary-foreground">
                  {a}
                </motion.span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* News + events */}
      <section className="bg-secondary/60 py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionTitle eyebrow="Latest" title="News & announcements" />
          <div className="mt-14"><LatestNews /></div>
          <div className="mt-24">
            <SectionTitle eyebrow="Calendar" title="Upcoming events" />
            <Stagger className="mt-10 grid gap-6 md:grid-cols-2">
              {events.map((e) => (
                <StaggerItem key={e.slug} variant="slideLeft"><ArticleCard a={e} /></StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionTitle center eyebrow="Voices" title="What our community says" />
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3" gap={0.15}>
            {testimonials.map((t) => (
              <StaggerItem key={t.who} className="rounded-3xl border border-border bg-card p-8">
                <Quote className="h-6 w-6 text-gold" />
                <p className="mt-4 font-display text-xl leading-relaxed">“{t.quote}”</p>
                <p className="mt-6 text-sm font-semibold">{t.who}</p>
                <p className="text-xs text-muted-foreground">{t.note}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-32">
        <Reveal variant="scaleUp" className="grain relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-night px-8 py-20 text-center md:px-20">
          <SplitHeading text="Admissions are open for the coming session" className="relative mx-auto max-w-3xl text-4xl font-light text-night-foreground md:text-6xl" />
          <p className="relative mx-auto mt-6 max-w-xl text-night-muted">Begin your application online in minutes. Our admissions team will guide you through every step.</p>
          <Link to="/admissions" className="relative mt-10 inline-block rounded-full bg-gradient-gold px-10 py-4 font-semibold text-accent-foreground shadow-gold transition-transform hover:-translate-y-1">
            Start your application
          </Link>
        </Reveal>
      </section>

      {/* Contact strip */}
      <section className="border-t border-border py-20">
        <Stagger className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3">
          {[
            { icon: MapPin, l: "Visit", v: school.address },
            { icon: Phone, l: "Call", v: school.phone },
            { icon: Mail, l: "Write", v: school.email },
          ].map((c) => (
            <StaggerItem key={c.l} className="flex gap-4">
              <c.icon className="h-6 w-6 shrink-0 text-gold" />
              <div>
                <p className="eyebrow">{c.l}</p>
                <p className="mt-1 break-words text-muted-foreground">{c.l === 'Call' ? <a href={`tel:${school.phone}`}>{c.v}</a> : c.l === 'Write' ? <a href={`mailto:${school.email}`}>{c.v}</a> : c.v}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </>
  );
}
