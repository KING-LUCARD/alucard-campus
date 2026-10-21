import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/hero.jpg";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — Alucard Institute" },
      { name: "description", content: "Reach our admissions and school offices." },
      { property: "og:title", content: "Contact us — Alucard Institute" },
      { property: "og:description", content: "Reach our admissions and school offices." },
    ],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Alucard Institute" title="Contact us" intro="Reach our admissions and school offices." image={img} />
      <section className="mx-auto max-w-3xl px-6 py-24 text-muted-foreground">Full page content is coming in the next stage.</section>
    </>
  ),
});
