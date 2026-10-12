import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Mail, Moon, Sun } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useTheme } from '../theme';
import { PageHeader, PageLoader, Spinner, useToast } from '../components/ui';

export default function Settings() {
  const { user } = useAuth();
  const [gmail, setGmail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const [dark, setDark] = useTheme();
  const result = params.get('gmail');
  const reason = params.get('reason');

  const load = () => api.get('/gmail').then(setGmail).catch(() => setGmail({ oauthConfigured: false, connection: null }));
  useEffect(() => {
    load();
    if (result === 'connected') toast?.('Gmail connected');
    if (result) setParams({}, { replace: true });
  }, []);

  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await api.post('/gmail/connect');
      window.location.assign(url);
    } catch (e) {
      toast?.(e.message, 'error');
      setBusy(false);
    }
  };
  const disconnect = async () => {
    setBusy(true);
    try {
      await api.post('/gmail/disconnect');
      await load();
      toast?.('Gmail disconnected');
    } catch (e) {
      toast?.(e.message, 'error');
    }
    setBusy(false);
  };

  if (!gmail) return <PageLoader />;
  const conn = gmail.connection;
  const expired = conn?.status === 'needs_reconnect';

  return (
    <>
      <PageHeader title="Settings" subtitle="Your sending setup and preferences." />
      <div className="space-y-5 max-w-2xl">
        <section className="card p-5">
          <h2 className="text-base mb-1">Gmail</h2>
          <p className="text-muted mb-4">Emails are sent from your own Gmail account, so recipients see your address and replies come straight to you.</p>
          {result === 'error' && (
            <div className="flex items-start gap-2 text-danger bg-danger-soft rounded-lg px-4 py-3 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {reason || 'Could not connect Gmail. Please try again.'}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-4">
            <div className={`h-10 w-10 rounded-full grid place-items-center ${conn && !expired ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>
              {conn && !expired ? <CheckCircle2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              {conn && !expired && <><p className="text-xs text-muted">Sending as</p><p className="font-medium break-all">{conn.email}</p></>}
              {expired && <><p className="font-medium">Connection expired</p><p className="text-xs text-muted">Google revoked or expired access for {conn.email}. Reconnect to keep sending.</p></>}
              {!conn && <><p className="font-medium">Not connected</p><p className="text-xs text-muted">{gmail.oauthConfigured ? 'Connect Gmail to start sending.' : 'Gmail sign-in is not configured on the server (see GOOGLE_* in server/.env).'}</p></>}
            </div>
            <div className="flex gap-2">
              {(!conn || expired) && <button className="btn-primary" onClick={connect} disabled={busy || !gmail.oauthConfigured}>{busy ? <Spinner /> : <Mail className="h-4 w-4" />}{expired ? 'Reconnect Gmail' : 'Connect Gmail'}</button>}
              {conn && <button className="btn-secondary" onClick={disconnect} disabled={busy}>Disconnect</button>}
            </div>
          </div>
          <p className="text-xs text-muted mt-3">Personal Gmail allows roughly 500 emails per day. We only ask permission to send email and to see which address you connected, and we cannot read your inbox.</p>
        </section>

        <section className="card p-5">
          <h2 className="text-base mb-4">Account</h2>
          <dl className="grid grid-cols-[100px_1fr] gap-y-2"><dt className="text-muted">Name</dt><dd>{user.name}</dd><dt className="text-muted">Email</dt><dd>{user.email}</dd></dl>
        </section>

        <section className="card p-5 flex items-center justify-between gap-4">
          <div><h2 className="text-base">Appearance</h2><p className="text-muted">Switch between light and dark theme.</p></div>
          <button className="btn-secondary" onClick={() => setDark(!dark)}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{dark ? 'Light' : 'Dark'} mode</button>
        </section>
      </div>
    </>
  );
}
