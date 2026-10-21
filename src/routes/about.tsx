import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/library.jpg";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About us — Alucard Institute" },
      { name: "description", content: "Our history, values, leadership, and facilities." },
      { property: "og:title", content: "About us — Alucard Institute" },
      { property: "og:description", content: "Our history, values, leadership, and facilities." },
    ],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Alucard Institute" title="About us" intro="Our history, values, leadership, and facilities." image={img} />
      <section className="mx-auto max-w-3xl px-6 py-24 text-muted-foreground">Full page content is coming in the next stage.</section>
    </>
  ),
});
