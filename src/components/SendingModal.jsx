import { useEffect, useState } from 'react';
import { Check, Circle, CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';
import { api } from '../api';
import { Modal } from './ui';

const RecipientStatus = ({ r, active, cancelled }) => {
  if (r.status === 'sent') return <><Check className="h-4 w-4 text-ok" /><span className="flex-1 truncate">{r.email}</span><span className="text-xs text-ok">Sent</span></>;
  if (r.status === 'failed') return <><X className="h-4 w-4 text-danger" /><span className="flex-1 truncate">{r.email}</span><span className="text-xs text-danger">Failed</span></>;
  if (active && !cancelled) return <><Loader2 className="h-4 w-4 text-primary animate-spin" /><span className="flex-1 truncate">{r.email}</span><span className="text-xs text-primary">Sending…</span></>;
  return <><Circle className="h-4 w-4 text-muted" /><span className="flex-1 truncate text-muted">{r.email}</span><span className="text-xs text-muted">{cancelled ? 'Not sent' : 'Pending'}</span></>;
};

export default function SendingModal({ campaignId, onDone }) {
  const [c, setC] = useState(null);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const { campaign } = await api.get(`/campaigns/${campaignId}`);
        if (stop) return;
        setC(campaign);
        if (campaign.status !== 'sending') return;
      } catch { /* transient, keep polling */ }
      if (!stop) setTimeout(tick, 1500);
    };
    tick();
    return () => { stop = true; };
  }, [campaignId]);

  if (!c) return <Modal title="Sending Emails…" dismissible={false}><div className="py-10 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></Modal>;

  const sending = c.status === 'sending';
  const cancelled = c.status === 'cancelled';
  const done = c.successfulCount + c.failedCount;
  const pct = c.totalRecipients ? Math.round((done / c.totalRecipients) * 100) : 0;
  const firstPending = c.recipients.find((r) => r.status === 'pending')?.id;
  const failed = c.recipients.filter((r) => r.status === 'failed');
  const R = 52, C = 2 * Math.PI * R;

  return (
    <Modal
      dismissible={false} wide
      title={sending ? 'Sending Emails…' : cancelled ? 'Sending cancelled' : 'Sending complete'}
      subtitle={sending ? 'Each recipient gets their own individual email. You can safely leave this page; sending continues on the server.' : undefined}
    >
      <div className="grid sm:grid-cols-[170px_1fr] gap-6 items-center">
        <div className="relative mx-auto h-36 w-36">
          <svg viewBox="0 0 120 120" className="-rotate-90 h-full w-full">
            <circle cx="60" cy="60" r={R} fill="none" strokeWidth="9" className="stroke-subtle" />
            <circle cx="60" cy="60" r={R} fill="none" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
              className={`transition-all duration-500 ${!sending && c.failedCount ? 'stroke-warn' : 'stroke-primary'}`} />
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <p className="text-xl font-semibold">{done} / {c.totalRecipients}</p>
            <p className="text-xs text-muted">{pct}%</p>
          </div>
        </div>
        <ul className="max-h-56 overflow-y-auto space-y-1.5 border-l border-line pl-5">
          {c.recipients.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-[13px]"><RecipientStatus r={r} active={r.id === firstPending} cancelled={cancelled} /></li>
          ))}
        </ul>
      </div>

      {sending ? (
        <div className="flex justify-center mt-6">
          <button className="btn-secondary" onClick={() => api.post(`/campaigns/${c.id}/cancel`)}>Cancel Sending</button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5 font-medium">
            <p className="flex items-center gap-2 text-ok"><CheckCircle2 className="h-5 w-5" />{c.successfulCount} email{c.successfulCount === 1 ? '' : 's'} sent successfully</p>
            {c.failedCount > 0 && <p className="flex items-center gap-2 text-danger"><XCircle className="h-5 w-5" />{c.failedCount} failed</p>}
          </div>
          {failed.length > 0 && (
            <div className="rounded-lg bg-danger-soft p-3 max-h-32 overflow-y-auto text-[13px] space-y-1">
              {failed.map((r) => <p key={r.id}><b>{r.email}</b> — {r.errorMessage}</p>)}
            </div>
          )}
          <div className="flex justify-end"><button className="btn-primary" onClick={() => onDone(c)}>View in History</button></div>
        </div>
      )}
    </Modal>
  );
}
