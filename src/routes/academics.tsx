import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/lab.jpg";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/academics")({
  head: () => ({
    meta: [
      { title: "Academics — Alucard Institute" },
      { name: "description", content: "Programs, departments, and our teaching approach." },
      { property: "og:title", content: "Academics — Alucard Institute" },
      { property: "og:description", content: "Programs, departments, and our teaching approach." },
    ],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Alucard Institute" title="Academics" intro="Programs, departments, and our teaching approach." image={img} />
      <section className="mx-auto max-w-3xl px-6 py-24 text-muted-foreground">Full page content is coming in the next stage.</section>
    </>
  ),
});
