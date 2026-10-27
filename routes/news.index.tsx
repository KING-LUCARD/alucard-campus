import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { CalendarDays, MapPin } from 'lucide-react';
import img from '@/assets/hero.jpg';
import { PageHero, SectionTitle } from '@/components/site/PageHero';
import { Stagger, StaggerItem } from '@/components/motion';
import { ArticleCard } from '@/components/site/sections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { articles, formatDate, newsCategories } from '@/lib/site';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/news/')({
  validateSearch: z.object({ category: z.enum(newsCategories).optional().catch(undefined), q: z.string().optional().catch(undefined) }),
  head: () => pageHead('News and events', 'School announcements, academic updates, sports, achievements and upcoming events.'),
  component: News,
});

function News() {
  const { category, q } = Route.useSearch();
  const navigate = useNavigate({ from: '/news/' });
  const term = (q ?? '').toLowerCase();
  const list = articles.filter((a) => a.category !== 'Event' && (!category || a.category === category) && (!term || (a.title + a.excerpt).toLowerCase().includes(term)));
  const events = articles.filter((a) => a.category === 'Event');
  return <>
    <PageHero eyebrow="Alucard Institute" title="News and events" intro="Demonstration stories and events — to be replaced with school-confirmed updates." image={img} />
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={!category ? 'default' : 'outline'} onClick={() => navigate({ search: (p) => ({ ...p, category: undefined }) })}>All</Button>
          {newsCategories.map((c) => <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} onClick={() => navigate({ search: (p) => ({ ...p, category: c }) })}>{c}</Button>)}
        </div>
        <Input aria-label="Search news" placeholder="Search news…" defaultValue={q ?? ''} onChange={(e) => navigate({ search: (p) => ({ ...p, q: e.target.value || undefined }), replace: true })} className="md:w-64" />
      </div>
      {list.length ? <Stagger key={`${category}-${q}`} className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{list.map((a) => <StaggerItem key={a.slug}><ArticleCard a={a} /></StaggerItem>)}</Stagger> : <p className="mt-10 text-muted-foreground">No stories match your filters.</p>}
    </section>
    <section className="bg-secondary py-24"><div className="mx-auto max-w-7xl px-6">
      <SectionTitle eyebrow="Calendar" title="Upcoming events" intro="Illustrative dates — official dates will be announced by the school." />
      <Stagger className="mt-12 grid gap-6 md:grid-cols-3">{events.map((e) => <StaggerItem key={e.slug} className="overflow-hidden rounded-lg border border-border bg-card">
        <img src={e.image} alt={e.alt} loading="lazy" width={1280} height={832} className="aspect-[16/9] w-full object-cover" />
        <div className="p-6"><p className="flex items-center gap-2 text-sm text-primary"><CalendarDays className="h-4 w-4" />{formatDate(e.date)}</p><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{e.location}</p><h3 className="mt-4 text-xl">{e.title}</h3><p className="mt-2 text-sm text-muted-foreground">{e.excerpt}</p><Button asChild variant="link" className="mt-2 px-0"><Link to="/news/$slug" params={{ slug: e.slug }}>Read more</Link></Button></div>
      </StaggerItem>)}</Stagger>
    </div></section>
  </>;
}
