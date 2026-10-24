import { createFileRoute } from '@tanstack/react-router';
import { Drama, HeartHandshake, Trophy } from 'lucide-react';
import students from '@/assets/students.jpg';
import { PageHero, SectionTitle } from '@/components/site/PageHero';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/student-life')({
  head: () => pageHead('Student life', 'Clubs, sport, creative activities and community engagement at ALUCARD INSTITUTE.'),
  component: StudentLife,
});

function StudentLife() {
  return <>
    <PageHero eyebrow="ALUCARD INSTITUTE" title="Life beyond the classroom" intro="Friendships, creative expression and opportunities to grow." image={students} />
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionTitle eyebrow="Discover your interests" title="Room to become yourself" intro="Illustrative activities — the school will confirm clubs, schedules and availability." />
      <Stagger className="mt-12 grid gap-8 md:grid-cols-3">
        {[
          { icon: Trophy, title: 'Sport & teamwork', text: 'Football, athletics and team games encourage resilience, fair play and healthy habits.' },
          { icon: Drama, title: 'Clubs & creativity', text: 'Debate, robotics, drama, music and visual art bring new ideas and talents into the spotlight.' },
          { icon: HeartHandshake, title: 'Community & leadership', text: 'Service projects and student-led initiatives develop empathy, responsibility and a sense of purpose.' },
        ].map((item) => <StaggerItem key={item.title} className="rounded-lg border border-border bg-card p-8"><item.icon className="h-8 w-8 text-primary" /><h2 className="mt-6 text-2xl">{item.title}</h2><p className="mt-4 leading-relaxed text-muted-foreground">{item.text}</p></StaggerItem>)}
      </Stagger>
      <Reveal className="mt-16 border-t border-border pt-10"><h2 className="text-3xl">Student development</h2><p className="mt-5 max-w-3xl text-lg text-muted-foreground">Learning extends to how we work together, care for our community and approach challenges. Academic curiosity and personal growth belong side by side.</p></Reveal>
    </section>
  </>;
}