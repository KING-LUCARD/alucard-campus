import { createFileRoute, Link } from '@tanstack/react-router';
import { Cpu, Drama, HeartHandshake, Trophy } from 'lucide-react';
import students from '@/assets/students.jpg';
import sports from '@/assets/sports.jpg';
import basketball from '@/assets/basketball.jpg';
import debate from '@/assets/debate.jpg';
import coding from '@/assets/coding.jpg';
import lab from '@/assets/lab.jpg';
import { PageHero, SectionTitle } from '@/components/site/PageHero';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/student-life')({
  head: () => pageHead('Student life', 'Clubs, sport, technology, creative activities, leadership and wellbeing at ALUCARD INSTITUTE.'),
  component: StudentLife,
});

const gallery = [
  { src: sports, alt: 'Students running a relay at inter-house sports', cap: 'Inter-house athletics', big: true },
  { src: basketball, alt: 'Students playing basketball on the school court', cap: 'Basketball' },
  { src: debate, alt: 'Student speaking at a debate podium', cap: 'Debate society' },
  { src: coding, alt: 'Students building a robot in coding club', cap: 'Coding & robotics', big: true },
  { src: lab, alt: 'Students conducting a science experiment', cap: 'Science experiments' },
  { src: students, alt: 'Friends together on campus', cap: 'Friendship & community' },
];

function StudentLife() {
  return <>
    <PageHero eyebrow="ALUCARD INSTITUTE" title="Life beyond the classroom" intro="Friendships, creative expression and opportunities to grow." image={students} />
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionTitle eyebrow="Discover your interests" title="Room to become yourself" intro="Illustrative activities — the school will confirm clubs, schedules and availability." />
      <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Trophy, title: 'Sport & teamwork', text: 'Football, basketball and athletics build resilience and fair play.' },
          { icon: Cpu, title: 'Technology', text: 'Coding and robotics clubs turn ideas into working projects.' },
          { icon: Drama, title: 'Creative arts', text: 'Drama, music and visual art bring talent into the spotlight.' },
          { icon: HeartHandshake, title: 'Leadership & wellbeing', text: 'Prefect roles, service projects and pastoral care support every student.' },
        ].map((item) => <StaggerItem key={item.title} className="rounded-lg border border-border bg-card p-7"><item.icon className="h-8 w-8 text-primary" /><h2 className="mt-5 text-xl">{item.title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p></StaggerItem>)}
      </Stagger>
    </section>
    <section className="bg-night py-24"><div className="mx-auto max-w-7xl px-6">
      <SectionTitle tone="dark" eyebrow="Gallery" title="Moments at Alucard" intro="Illustrative images representing student activities." />
      <Stagger className="mt-12 grid auto-rows-[220px] gap-4 md:grid-cols-3">
        {gallery.map((g) => <StaggerItem key={g.cap} variant="scaleUp" className={`group relative overflow-hidden rounded-2xl ${g.big ? 'md:col-span-2' : ''}`}>
          <img src={g.src} alt={g.alt} loading="lazy" width={1280} height={832} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-veil" /><p className="absolute bottom-4 left-5 font-display text-xl text-night-foreground">{g.cap}</p>
        </StaggerItem>)}
      </Stagger>
    </div></section>
    <Reveal className="mx-auto max-w-7xl px-6 py-20 text-center"><h2 className="text-3xl">Ready to join our community?</h2><div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild><Link to="/admissions">Apply now</Link></Button><Button asChild variant="outline"><Link to="/academics">Explore academics</Link></Button></div></Reveal>
  </>;
}
