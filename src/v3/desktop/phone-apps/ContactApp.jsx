// ContactApp.jsx — the phone "rings", then a short message form posts to /api/contact (see docs/CONTACT.md).
// If the server cannot take it, the form offers a prefilled mailto link instead.
import { useEffect, useState } from 'react';
import { contact } from '../../content/index.js';

const T = { bg: '#0A0E17', card: '#141B2A', line: '#243049', ink: '#F8FAFC', mute: '#9AA7BD', go: '#34D399' };
const field = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: `1px solid ${T.line}`, background: T.card, color: T.ink, font: '15px system-ui, sans-serif' };
const ghost = { border: 0, background: 'none', color: T.mute, cursor: 'pointer', fontSize: 14 };

export default function ContactApp({ onClose }) {
  const [step, setStep] = useState('ring'); // ring | form | sent
  const [f, setF] = useState({ name: '', email: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (step !== 'ring') return undefined;
    const t = setTimeout(() => setStep('form'), 9000);
    return () => clearTimeout(t);
  }, [step]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const mailto = `mailto:${contact.email}?subject=${encodeURIComponent('Hello from your portfolio')}&body=${encodeURIComponent(f.message)}`;

  async function send(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) setStep('sent');
      else { setErr(d.error && d.error !== 'unavailable' ? d.error : 'The message could not be sent from here.'); setFallback(r.status >= 500 || r.status === 429); }
    } catch { setErr('No connection to the server.'); setFallback(true); }
    setBusy(false);
  }

  const center = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' };
  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, color: T.ink, display: 'flex', flexDirection: 'column', padding: '40px 18px', boxSizing: 'border-box', font: '15px system-ui, sans-serif', overflow: 'auto' }}>
      <style>{'@keyframes pc-ring{0%,70%,100%{transform:none}10%,30%,50%{transform:translateX(-3px) rotate(-6deg)}20%,40%,60%{transform:translateX(3px) rotate(6deg)}}@keyframes pc-pulse{0%{box-shadow:0 0 0 0 rgba(52,211,153,.55)}100%{box-shadow:0 0 0 26px rgba(52,211,153,0)}}@media (prefers-reduced-motion:reduce){.pc-a{animation:none!important}}'}</style>
      {step === 'ring' && (
        <div style={center}>
          <span style={{ color: T.mute, fontSize: 13, letterSpacing: '.12em' }}>INCOMING</span>
          <div className="pc-a" style={{ width: 84, height: 84, borderRadius: '50%', background: T.go, color: '#04130D', display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 700, animation: 'pc-ring 1.1s infinite, pc-pulse 1.1s infinite' }}>D</div>
          <b style={{ fontSize: 22 }}>Dhruv</b>
          <span style={{ color: T.mute }}>Leave him a message</span>
          <button type="button" onClick={() => setStep('form')} style={{ marginTop: 12, padding: '12px 34px', border: 0, borderRadius: 99, background: T.go, color: '#04130D', font: '600 16px system-ui', cursor: 'pointer' }}>Answer</button>
          <button type="button" onClick={onClose} style={ghost}>Decline</button>
        </div>
      )}
      {step === 'form' && (
        <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <b style={{ fontSize: 20 }}>Message Dhruv</b>
          <input style={field} placeholder="Your name" value={f.name} onChange={set('name')} maxLength={80} aria-label="Your name" autoComplete="name" />
          <input style={field} placeholder="Your email (so he can reply)" type="email" required value={f.email} onChange={set('email')} maxLength={120} aria-label="Your email" autoComplete="email" />
          <textarea style={{ ...field, minHeight: 110, resize: 'none' }} placeholder="A short message" required minLength={5} maxLength={1000} value={f.message} onChange={set('message')} aria-label="Message" />
          <input value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, opacity: 0 }} />
          {err && <p role="alert" style={{ margin: 0, color: '#FCA5A5', fontSize: 13 }}>{err}</p>}
          <button type="submit" disabled={busy} style={{ padding: 12, border: 0, borderRadius: 10, background: T.go, color: '#04130D', font: '600 16px system-ui', cursor: 'pointer' }}>{busy ? 'Sending…' : 'Send'}</button>
          {fallback && <a href={mailto} style={{ color: T.go, fontSize: 14 }}>Open your email app instead</a>}
          <button type="button" onClick={onClose} style={ghost}>Cancel</button>
        </form>
      )}
      {step === 'sent' && (
        <div style={center}>
          <div style={{ fontSize: 40 }}>✓</div>
          <b style={{ fontSize: 20 }}>Message sent</b>
          <span style={{ color: T.mute }}>He will reply to {f.email}.</span>
          <button type="button" onClick={onClose} style={{ padding: '10px 28px', border: `1px solid ${T.line}`, borderRadius: 99, background: 'none', color: T.ink, cursor: 'pointer' }}>Done</button>
        </div>
      )}
    </div>
  );
}
