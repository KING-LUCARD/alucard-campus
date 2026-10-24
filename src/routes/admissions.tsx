import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/students.jpg";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Alucard Institute" },
      { name: "description", content: "Requirements and how to apply to Alucard Institute." },
      { property: "og:title", content: "Admissions — Alucard Institute" },
      { property: "og:description", content: "Requirements and how to apply to Alucard Institute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Alucard Institute" title="Admissions" intro="Requirements and how to apply to Alucard Institute." image={img} />
      <section className="mx-auto max-w-3xl px-6 py-24 text-muted-foreground">Full page content is coming in the next stage.</section>
    </>
  ),
});
