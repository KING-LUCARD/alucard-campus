import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { ArrowRight, LogIn, UserPlus } from 'lucide-react';
import hero from '@/assets/hero.jpg';
import { Button } from '@/components/ui/button';
import { useSchoolAuth } from '@/components/SchoolAuth';
import { school } from '@/lib/site';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/')({
  head: () => pageHead('Welcome', 'Welcome to ALUCARD INSTITUTE, Lekki. Sign up or log in to explore our school.'),
  component: Welcome,
});

function Welcome() {
  const { user } = useSchoolAuth();
  return (
    <section className="relative grid min-h-screen place-items-center overflow-hidden bg-night px-6 py-32">
      <motion.img src={hero} alt="Alucard Institute campus at dusk" initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1.05, opacity: 0.45 }} transition={{ duration: 2 }} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-veil" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }} className="relative max-w-2xl text-center">
        <p className="eyebrow">Welcome to</p>
        <h1 className="mt-4 text-5xl text-night-foreground md:text-7xl">{school.name}</h1>
        <p className="mt-4 font-display italic text-gold">{school.motto}</p>
        <p className="mx-auto mt-6 max-w-lg text-lg text-night-muted">{school.tagline} Create an account or log in to continue to the school website.</p>
        {user ? (
          <Button asChild size="lg" className="mt-10 bg-gradient-gold text-accent-foreground"><Link to="/home">Enter the school <ArrowRight /></Link></Button>
        ) : (
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-gradient-gold text-accent-foreground"><Link to="/auth" search={{ mode: 'register' }}><UserPlus /> Sign Up</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth" search={{ mode: 'signin' }}><LogIn /> Log In</Link></Button>
          </div>
        )}
      </motion.div>
    </section>
  );
}
