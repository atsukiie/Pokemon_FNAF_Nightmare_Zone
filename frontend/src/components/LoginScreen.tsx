'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';

type Props = { onAuthenticated: (token: string) => void };

export default function LoginScreen({ onAuthenticated }: Props) {
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setHelpMessage('');
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
        body: JSON.stringify({ accessCode }), signal: AbortSignal.timeout(15000),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === 'string' ? body.message : 'Sign-in failed. Check the backend connection and try again.');
      if (typeof body.accessToken !== 'string') throw new Error('The server did not return a valid sign-in session.');
      onAuthenticated(body.accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in. Check the backend connection.');
    } finally { setLoading(false); }
  }

  return <main className="login-page">
    <div className="login-backdrop" aria-hidden="true" />
    <div className="login-vignette" aria-hidden="true" />
    <a className="login-brand" href="#home" aria-label="Nightmare Zone Admin home">
      <Image className="site-logo login-site-logo" src="/pokemon-admin-logo.webp" alt="Pokémon Wiki" width={512} height={512} priority />
      <span className="login-brand-caption">NIGHTMARE ZONE · ADMIN</span>
    </a>
    <section className="login-card" aria-labelledby="login-title">
      <h1 id="login-title"><span aria-hidden="true">☾</span> WELCOME BACK</h1>
      <p className="login-intro">Enter the admin code to access the Nightmare Zone Dashboard</p>
      <form onSubmit={submit}>
        <label className="login-visually-hidden" htmlFor="login-access-code">Admin access code</label>
        <div className="login-input-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10" width="13" height="10" rx="2"/><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3"/><path d="M12 14v2"/></svg><input id="login-access-code" type={showCode ? 'text' : 'password'} autoComplete="current-password" placeholder="Admin access code" value={accessCode} onChange={e => setAccessCode(e.target.value)} required/><button className="login-password-toggle" type="button" onClick={() => setShowCode(value => !value)} aria-label={showCode ? 'Hide access code' : 'Show access code'}><svg viewBox="0 0 24 24" aria-hidden="true">{showCode ? <><path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/></> : <><path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/><path d="m4 4 16 16"/></>}</svg></button></div>
        <div className="login-options"><span className="login-code-note">Shared admin access</span><button type="button" className="forgot-password" onClick={() => setHelpMessage('Set DASHBOARD_ACCESS_CODE in the backend environment settings. On Vercel, add it under Project Settings → Environment Variables.')}>Where do I find the code?</button></div>
        {helpMessage && <p className="login-help" role="status">{helpMessage}</p>}
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit" disabled={loading}>{loading ? <><span className="login-spinner"/> Checking code…</> : <><span aria-hidden="true">⊙</span> LOG IN</>}</button>
      </form>
      <p className="login-footnote"><span>♟</span><i/> NIGHTMARE ZONE <i/><span>⊙</span></p>
    </section>
  </main>;
}
