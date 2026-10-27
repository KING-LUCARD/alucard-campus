import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useSchoolAuth } from '@/components/SchoolAuth';
import { getAccount } from '@/lib/school.functions';
import { pageHead } from '@/lib/metadata';

const portalLinks: Record<string, { to: string; label: string }> = {
  admin: { to: '/admin', label: 'Open the Admin portal' },
  principal: { to: '/principal', label: 'Open the Principal portal' },
  teacher: { to: '/teacher', label: 'Open the Teacher portal' },
  student: { to: '/student', label: 'Open the Student portal' },
};

const accountQuery = queryOptions({ queryKey: ['school-account'], queryFn: () => getAccount() });

export const Route = createFileRoute('/_authenticated/account')({
  head: () => pageHead('My school account', 'Your Alucard Institute profile, school access requests and admission applications.'),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(accountQuery); },
  errorComponent: () => <section className="mx-auto min-h-[75vh] max-w-3xl px-6 pb-24 pt-40"><h1 className="text-3xl">Account unavailable</h1><p role="alert" className="mt-6 text-muted-foreground">Your account could not be loaded. Please try signing in again.</p><AccountSignOut /></section>,
  notFoundComponent: () => <p className="px-6 pb-24 pt-40">School account not found.</p>,
  component: Account,
});

function AccountSignOut() {
  const { signOut } = useSchoolAuth();
  return <Button variant="outline" className="mt-6" onClick={() => void signOut()}>Sign out</Button>;
}

function Account() {
  const { data } = useSuspenseQuery(accountQuery);
  return <section className="mx-auto min-h-[75vh] max-w-3xl px-6 pb-24 pt-40">
    <p className="eyebrow">Alucard Institute</p>
    <h1 className="mt-3 text-4xl">My school account</h1>
    <p className="mt-6 text-lg">{data.profile.display_name}</p>
    <p className="break-words text-muted-foreground">{data.profile.email}</p>
    <h2 className="mt-10 text-2xl">School access</h2>
    {data.roles.length > 0 ? <ul className="mt-4 space-y-2">{data.roles.map(({ role }) => <li key={role} className="capitalize">{role}</li>)}</ul> : <p className="mt-4 text-muted-foreground">No active school role has been assigned.</p>}
    <div className="mt-6 flex flex-wrap gap-3">
      {data.roles.map(({ role }) => portalLinks[role] ? <Button key={role} asChild><Link to={portalLinks[role].to}>{portalLinks[role].label}</Link></Button> : null)}
    </div>
    <ul className="mt-4 space-y-2">{data.requests.map((request) => <li key={request.id} className="capitalize">{request.requested_role}: {request.status}</li>)}</ul>
    <h2 className="mt-10 text-2xl">Admission applications</h2>
    {data.applications.length === 0 ? <p className="mt-4 text-muted-foreground">No applications submitted.</p> : <ul className="mt-4 space-y-3">{data.applications.map((application) => <li key={application.id}>{application.student_name} · {application.entry_year} · {application.status}</li>)}</ul>}
    <AccountSignOut />
  </section>;
}