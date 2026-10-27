import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/lab.jpg";
import { PageHero } from "@/components/site/PageHero";
import { SectionTitle } from '@/components/site/PageHero';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { coreSubjects, departments, schoolClasses } from '@/lib/site';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute("/academics")({
  head: () => pageHead('Academics', 'JSS1–JSS3 and SS1–SS3, with Science, Commercial and Arts pathways at ALUCARD INSTITUTE.'),
  component: () => (
    <>
      <PageHero eyebrow="Alucard Institute" title="Academics" intro="Programs, departments, and our teaching approach." image={img} />
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionTitle eyebrow="A foundation for the future" title="Junior & senior secondary education" intro="Mathematics and English are core subjects across all classes." />
        <Stagger className="mt-12 grid gap-8 md:grid-cols-2">
          {['Junior Secondary School', 'Senior Secondary School'].map((title, index) => <StaggerItem key={title} className="border-t-2 border-primary pt-6"><h2 className="text-3xl">{title}</h2><div className="mt-6 grid grid-cols-3 gap-3">{schoolClasses.slice(index * 3, index * 3 + 3).map((name) => <div key={name} className="rounded-md border border-border bg-card py-5 text-center font-semibold">{name}</div>)}</div><p className="mt-5 text-muted-foreground">{index === 0 ? 'Build strong foundations in literacy, numeracy, scientific thinking and creativity.' : 'Deepen subject knowledge through Science, Commercial or Arts pathways.'}</p></StaggerItem>)}
        </Stagger>
      </section>
      <section className="bg-secondary py-24"><div className="mx-auto max-w-7xl px-6"><SectionTitle eyebrow="Your academic pathway" title="Three departments. Boundless curiosity." intro="Illustrative subject offerings — final curriculum and examination requirements will be confirmed by the school." /><Stagger className="mt-12 grid gap-6 md:grid-cols-3">{departments.map((department) => <StaggerItem key={department.name} className="rounded-lg border border-border bg-card p-8"><h2 className="text-3xl">{department.name}</h2><p className="mt-4 text-muted-foreground">{department.description}</p><h3 className="mt-7 font-sans text-sm font-semibold">Core subjects</h3><p className="mt-2 text-sm">{coreSubjects.join(' · ')}</p><h3 className="mt-6 font-sans text-sm font-semibold">Pathway subjects</h3><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{department.subjects.map((subject) => <li key={subject}>{subject}</li>)}</ul></StaggerItem>)}</Stagger></div></section>
      <section className="mx-auto max-w-7xl px-6 py-24"><Reveal><h2 className="text-3xl">Learning through inquiry</h2><p className="mt-5 max-w-3xl text-lg text-muted-foreground">Practical investigations, thoughtful discussion and independent projects connect classroom knowledge to the wider world.</p></Reveal></section>
    </>
  ),
});
