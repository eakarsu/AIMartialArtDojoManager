import { useEffect, useState } from 'react';
import './App.css';

const FEATURES = ['Manage students and memberships', 'Schedule classes and attendance', 'Review belt progression'];
const configuredApiBase = process.env.REACT_APP_API_URL || '';
const API_BASE = typeof window === 'undefined' ? configuredApiBase : configuredApiBase.replace(/127\.0\.0\.1|localhost/, window.location.hostname);

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed with HTTP ${response.status}`);
  return body;
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    api('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then((body) => setUser(body.user || body)).catch(() => localStorage.removeItem('authToken'));
  }, []);

  const fillDemoCredentials = async () => {
    setError(''); setBusy(true);
    try { const credentials = await api('/api/auth/demo-credentials'); setEmail(credentials.email); setPassword(credentials.password)

}
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const handleLogin = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('authToken', result.token);
      const identity = await api('/api/auth/me', { headers: { Authorization: `Bearer ${result.token}` } });
      setUser(identity.user || identity);
    } catch (requestError) { localStorage.removeItem('authToken'); setError(requestError.message); }
    finally { setBusy(false); }
  };

  if (!user) return <main className="login-shell"><form className="login-card" onSubmit={handleLogin}>
    <p className="eyebrow">AI Martial Arts Dojo Manager</p><h1>Sign in to your dojo workspace</h1><p className="lede">Use the provisioned local account to manage members, classes, and progression.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label>
    <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
    <button className="demo-button" type="button" onClick={fillDemoCredentials} disabled={busy}>Auto Fill Demo Credentials</button>
    <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Sign In'}</button>
  </form></main>;

  return <main className="shell"><section className="hero"><div className="account-row"><p className="eyebrow">Authenticated workspace</p><button type="button" onClick={() => { localStorage.removeItem('authToken'); setUser(null); }}>Sign out</button></div><h1>AI Martial Arts Dojo Manager</h1><p className="lede">Welcome, {user.name || user.email}. Your authenticated dojo workflow is ready.</p><div className="service service--ready" role="status"><span>Connected</span><p>Backend API and session identity are verified.</p></div></section><section aria-labelledby="workflow-heading"><h2 id="workflow-heading">Primary workflow</h2><div className="workflow">{FEATURES.map((feature, index) => <article key={feature}><strong>{String(index + 1).padStart(2, '0')}</strong><h3>{feature}</h3><p>Continue this authenticated workflow with auditable saved results.</p></article>)}</div></section></main>;
}
