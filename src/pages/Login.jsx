import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api } from '../api';
import { Logo } from '../components/Layout';
import { Spinner } from '../components/ui';

export default function Login() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/auth/config').then((c) => setOpen(c.registrationOpen)).catch(() => {}); }, []);
  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6 scale-125"><Logo /></div>
        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <h1 className="text-lg">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
            <p className="text-muted mt-1">{mode === 'login' ? 'Sign in to send your emails.' : 'Start sending personalized emails.'}</p>
          </div>
          {mode === 'register' && (
            <div><label className="label" htmlFor="name">Name</label><input id="name" className="input" required value={form.name} onChange={set('name')} autoComplete="name" /></div>
          )}
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" required value={form.email} onChange={set('email')} autoComplete="email" /></div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" required minLength={mode === 'register' ? 8 : undefined} value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'register' && <p className="text-xs text-muted mt-1">At least 8 characters.</p>}
          </div>
          {error && <p className="text-danger text-sm" role="alert">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />}{mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        {open && (
          <p className="text-center text-muted mt-4">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button className="text-primary font-medium hover:underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
