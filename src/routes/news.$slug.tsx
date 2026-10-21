import { createFileRoute, notFound } from "@tanstack/react-router";
import img from "@/assets/hero.jpg";
import { PageHero } from "@/components/site/PageHero";
import { articles } from "@/lib/site";

export const Route = createFileRoute("/news/$slug")({
  loader: ({ params }) => {
    const a = articles.find((x) => x.slug === params.slug);
    if (!a) throw notFound();
    return a;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Article"} — Alucard Institute` },
      { name: "description", content: loaderData?.excerpt ?? "" },
      { property: "og:title", content: loaderData?.title ?? "Article" },
      { property: "og:description", content: loaderData?.excerpt ?? "" },
      { property: "og:type", content: "article" },
    ],
  }),
  component: Article,
});

function Article() {
  const a = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow={a.category} title={a.title} intro={a.excerpt} image={img} />
      <article className="mx-auto max-w-3xl space-y-6 px-6 py-24 text-lg">
        {a.body.map((p, i) => <p key={i}>{p}</p>)}
      </article>
    </>
  );
}
