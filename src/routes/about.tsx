import { createFileRoute, Link } from '@tanstack/react-router';
import { Award, Compass, Lightbulb, Scale, ShieldCheck, Users } from 'lucide-react';
import img from '@/assets/library.jpg';
import lab from '@/assets/lab.jpg';
import { PageHero, SectionTitle } from '@/components/site/PageHero';
import { ImageReveal, Reveal, Stagger, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { departments, schoolClasses } from '@/lib/site';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/about')({
  head: () => pageHead('About us', 'Mission, vision, core values and educational philosophy of ALUCARD INSTITUTE, Lekki.'),
  component: About,
});

const values = [
  { icon: Award, t: 'Excellence', d: 'We pursue the highest standards in learning and character.' },
  { icon: ShieldCheck, t: 'Integrity', d: 'We act honestly and take responsibility for our choices.' },
  { icon: Scale, t: 'Discipline', d: 'Focus, order and consistency turn potential into achievement.' },
  { icon: Lightbulb, t: 'Innovation', d: 'We question, experiment and create new solutions.' },
  { icon: Users, t: 'Respect', d: 'Every person in our community is valued and heard.' },
  { icon: Compass, t: 'Leadership', d: 'Students learn to serve, guide and inspire others.' },
];

function About() {
  return <>
    <PageHero eyebrow="About Alucard Institute" title="More Than a School. A Foundation for the Future." intro="A secondary school in Lekki where knowledge, discipline and creativity prepare students for a changing world." image={img} />
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-2">
      <Reveal><p className="eyebrow">Our mission</p><h2 className="mt-3 text-3xl">Nurturing curious, disciplined and compassionate learners</h2><p className="mt-5 text-muted-foreground">We provide a rigorous, supportive education that equips every student with knowledge, character and the confidence to lead.</p></Reveal>
      <Reveal><p className="eyebrow">Our vision</p><h2 className="mt-3 text-3xl">Graduates who shape the future with purpose</h2><p className="mt-5 text-muted-foreground">To be recognised for developing young people who think critically, act ethically and contribute meaningfully to society.</p></Reveal>
    </section>
    <section className="bg-secondary py-24"><div className="mx-auto max-w-7xl px-6">
      <SectionTitle eyebrow="Core values" title="What we stand for" />
      <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{values.map((v) => <StaggerItem key={v.t} className="rounded-lg border border-border bg-card p-8 transition-transform hover:-translate-y-1"><v.icon className="h-8 w-8 text-primary" /><h3 className="mt-5 text-2xl">{v.t}</h3><p className="mt-3 text-muted-foreground">{v.d}</p></StaggerItem>)}</Stagger>
    </div></section>
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">
      <ImageReveal src={lab} alt="Students in a science laboratory" className="aspect-[4/3] rounded-2xl" />
      <Reveal><p className="eyebrow">Educational philosophy</p><h2 className="mt-3 text-3xl">Learning through inquiry</h2><p className="mt-5 text-muted-foreground">Students learn by asking questions, investigating evidence and explaining their thinking. Teachers guide with high expectations and genuine care.</p>
        <h3 className="mt-8 font-sans text-sm font-semibold">Academic structure</h3><p className="mt-2 text-muted-foreground">{schoolClasses.join(' · ')} — with {departments.map((d) => d.name).join(', ')} pathways in senior school.</p>
        <h3 className="mt-6 font-sans text-sm font-semibold">Student development</h3><p className="mt-2 text-muted-foreground">Clubs, sport, leadership roles and pastoral support help every student grow beyond the classroom.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link to="/academics">Explore academics</Link></Button><Button asChild variant="outline"><Link to="/admissions">Apply now</Link></Button></div>
      </Reveal>
    </section>
  </>;
}
