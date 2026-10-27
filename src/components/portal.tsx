import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { useSchoolAuth } from '@/components/SchoolAuth';
import { cn } from '@/lib/utils';

export function PortalShell({ eyebrow, title, blurb, children }: { eyebrow: string; title: string; blurb: string; children: ReactNode }) {
  const { user, signOut } = useSchoolAuth();
  return (
    <section className="mx-auto min-h-[75vh] max-w-6xl px-6 pb-24 pt-32">
      <Reveal variant="fadeUp">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-3 font-display text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">{blurb}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="max-w-56 truncate text-sm text-muted-foreground">{user?.email}</span>
            <Button asChild variant="outline" size="sm"><Link to="/account">My account</Link></Button>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>Sign out</Button>
          </div>
        </div>
      </Reveal>
      <div className="mt-12 space-y-16">{children}</div>
    </section>
  );
}

export function PortalSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Reveal variant="fadeUp" className={className}>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </Reveal>
  );
}

export function StatCards({ stats }: { stats: { label: string; value: number | string; hint?: string }[] }) {
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <StaggerItem key={s.label}>
          <Card className="h-full">
            <CardContent className="pt-6">
              <p className="font-display text-3xl">{s.value}</p>
              <p className="mt-1 text-sm font-medium">{s.label}</p>
              {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
            </CardContent>
          </Card>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{children}</p>;
}

export function PortalDenied({ area }: { area: string }) {
  return (
    <section className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-start justify-center px-6 pb-24 pt-40">
      <p className="eyebrow">Restricted area</p>
      <h1 className="mt-3 font-display text-4xl">This portal is for {area}</h1>
      <p className="mt-4 text-muted-foreground">
        Your signed-in account does not have an approved {area} role. If you believe this is a mistake, contact the school office or check your account status.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild><Link to="/account">Go to my account</Link></Button>
        <Button asChild variant="outline"><Link to="/home">Back to home</Link></Button>
      </div>
    </section>
  );
}

export function FormMessage({ message, tone = 'error' }: { message: string | null; tone?: 'error' | 'success' }) {
  if (!message) return null;
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={cn('mt-3 text-sm', tone === 'error' ? 'text-destructive' : 'text-green-700 dark:text-green-400')}>
      {message}
    </p>
  );
}
