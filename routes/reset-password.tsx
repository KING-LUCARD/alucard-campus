import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/site/Field';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/reset-password')({head:()=>pageHead('Reset password','Set a new password using your secure recovery link.'),component:ResetPassword});
function ResetPassword(){
 const [valid,setValid]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setValid(new URLSearchParams(window.location.hash.slice(1)).get('type')==='recovery');},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);const f=new FormData(e.currentTarget);const password=String(f.get('password'));if(password!==f.get('confirm')){setMessage('Passwords do not match.');setBusy(false);return;}const {error}=await supabase.auth.updateUser({password});setMessage(error?error.message:'Your password has been updated.');setBusy(false);}
 return <section className="mx-auto min-h-[75vh] max-w-md px-6 pb-24 pt-40"><h1 className="text-4xl">Set a new password</h1>{valid?<form onSubmit={submit} className="mt-8 grid gap-5"><Field label="New password"><Input name="password" type="password" autoComplete="new-password" minLength={12} required/></Field><Field label="Confirm password"><Input name="confirm" type="password" autoComplete="new-password" minLength={12} required/></Field><Button disabled={busy}>Update password</Button></form>:<p className="mt-6 text-muted-foreground">Open this page from the password reset link in your email.</p>}<p role="status" className="mt-5">{message}</p><Button asChild variant="link" className="mt-5"><Link to="/auth">Return to sign-in</Link></Button></section>;
}