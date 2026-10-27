import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { ArrowRight, LogIn, LogOut, UserPlus } from 'lucide-react';
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
  const { user, signOut } = useSchoolAuth();
  return (
    <section className="relative grid min-h-screen place-items-center overflow-hidden bg-night px-6 py-32">
      <motion.img src={hero} alt="Alucard Institute campus at dusk" initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1.05, opacity: 0.45 }} transition={{ duration: 2 }} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-veil" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }} className="relative max-w-2xl text-center">
        <p className="eyebrow">Welcome to</p>
        <h1 className="mt-4 text-5xl text-night-foreground md:text-7xl">{school.name}</h1>
        <p className="mt-4 font-display italic text-gold">{school.motto}</p>
        <p className="mx-auto mt-6 max-w-lg text-lg text-night-muted">{school.tagline}</p>
        <motion.div
          initial={{ opacity: 0, scale: 0.55, y: 60, rotateX: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 1.6 }}
          style={{ transformPerspective: 900 }}
          className="relative mx-auto mt-10 max-w-md"
          role="dialog"
          aria-label="Choose how to enter"
        >
          <motion.span aria-hidden animate={{ opacity: [0.25, 0.6, 0.25], scale: [1, 1.04, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-gold opacity-30 blur-2xl" />
          <div className="grain relative overflow-hidden rounded-3xl border border-gold/40 bg-night/80 p-8 shadow-elegant backdrop-blur-xl">
            <p className="eyebrow">{user ? 'Welcome back' : 'Get started'}</p>
            <h2 className="mt-3 text-2xl font-light text-night-foreground">{user ? 'You’re signed in' : 'How would you like to enter?'}</h2>
            {user ? (
              <div className="mt-6 flex flex-col gap-3">
                <Button asChild size="lg" className="w-full bg-gradient-gold text-accent-foreground"><Link to="/home">Enter the school <ArrowRight /></Link></Button>
                <Button size="lg" variant="outline" className="w-full" onClick={() => void signOut()}><LogOut /> Sign out</Button>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="bg-gradient-gold text-accent-foreground"><Link to="/auth" search={{ mode: 'register' }}><UserPlus /> Sign Up</Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/auth" search={{ mode: 'signin' }}><LogIn /> Log In</Link></Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
