import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/hero.jpg";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News and events — Alucard Institute" },
      { name: "description", content: "Latest news, announcements, and upcoming events." },
      { property: "og:title", content: "News and events — Alucard Institute" },
      { property: "og:description", content: "Latest news, announcements, and upcoming events." },
    ],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Alucard Institute" title="News and events" intro="Latest news, announcements, and upcoming events." image={img} />
      <section className="mx-auto max-w-3xl px-6 py-24 text-muted-foreground">Full page content is coming in the next stage.</section>
    </>
  ),
});
