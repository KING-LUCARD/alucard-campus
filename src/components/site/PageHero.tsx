import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { SplitHeading } from "@/components/motion";

export function PageHero({ eyebrow, title, intro, image }: { eyebrow: string; title: string; intro: string; image: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  return (
    <section ref={ref} className="relative flex min-h-[70vh] items-end overflow-hidden bg-night pb-20 pt-40">
      <motion.img src={image} alt="" aria-hidden style={reduce ? {} : { scale }} className="absolute inset-0 h-full w-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-veil" />
      <motion.div style={reduce ? {} : { y, opacity }} className="relative mx-auto w-full max-w-7xl px-6">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="eyebrow">
          {eyebrow}
        </motion.p>
        <SplitHeading as="h1" immediate delay={0.1} text={title} className="mt-4 max-w-4xl text-5xl font-medium text-night-foreground md:text-7xl" />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-6 max-w-2xl text-lg text-night-muted"
        >
          {intro}
        </motion.p>
      </motion.div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, intro, tone = "light", center }: { eyebrow: string; title: string; intro?: string; tone?: "light" | "dark"; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <motion.p
        initial={{ opacity: 0, letterSpacing: "0.6em" }}
        whileInView={{ opacity: 1, letterSpacing: "0.28em" }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="eyebrow"
      >
        {eyebrow}
      </motion.p>
      <SplitHeading text={title} className={`mt-4 text-4xl font-medium md:text-5xl ${tone === "dark" ? "text-night-foreground" : "text-foreground"}`} />
      {intro && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className={`mt-5 text-lg ${tone === "dark" ? "text-night-muted" : "text-muted-foreground"}`}
        >
          {intro}
        </motion.p>
      )}
    </div>
  );
}
