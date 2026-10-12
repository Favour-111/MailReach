import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Braces, Paperclip, Send, Users } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useCompose } from '../compose';
import { useSender } from '../lib/useSender';
import { customKeys, recipientVars, render, usedVars, BASE_VARS } from '../lib/vars';
import SendingModal from '../components/SendingModal';
import { Empty, IconTile, PageHeader, Spinner, useToast } from '../components/ui';

export default function Preview() {
  const { user } = useAuth();
  const c = useCompose();
  const nav = useNavigate();
  const toast = useToast();
  const sender = useSender();
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [campaignId, setCampaignId] = useState(null);

  const { recipients } = c;
  const r = recipients[Math.min(idx, recipients.length - 1)];
  const vars = useMemo(() => (r ? recipientVars(r, user.name) : {}), [r, user.name]);
  const used = useMemo(() => usedVars(c.subject, c.body), [c.subject, c.body]);

  // Variables used in the email that some recipients have no value for
  const missing = useMemo(() => used.map((v) => ({ v, n: recipients.filter((x) => !String(recipientVars(x, user.name)[v] ?? '').trim()).length })).filter((m) => m.n > 0), [used, recipients, user.name]);

  if (!recipients.length) {
    return (
      <>
        <PageHeader title="Preview & Send" subtitle="Review your email before sending." />
        <div className="card"><Empty icon={Users} title="No recipients yet">Add recipients before previewing your email.</Empty>
          <div className="flex justify-center pb-8"><button className="btn-primary" onClick={() => nav('/compose/recipients')}>Add recipients</button></div></div>
      </>
    );
  }

  const send = async () => {
    setBusy(true);
    try {
      const { id } = await api.post('/campaigns', {
        subject: c.subject, body: c.body, recipients, attachmentIds: c.attachments.map((a) => a.id),
      });
      setCampaignId(id);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const finished = async () => {
    const id = campaignId;
    if (c.draftId) api.del(`/drafts/${c.draftId}`).catch(() => {});
    c.reset();
    nav(`/history/${id}`);
  };

  const keys = [...BASE_VARS, ...customKeys(recipients)].filter((k) => used.includes(k));
  const n = recipients.length;

  return (
    <>
      <PageHeader title="Preview & Send" subtitle={`Review your email before sending to ${n} recipient${n === 1 ? '' : 's'}.`}>
        <button className="btn-secondary" onClick={() => nav('/compose/recipients')}>Back</button>
        <button className="btn-primary" onClick={send} disabled={busy || !sender?.configured}>{busy ? <Spinner /> : <Send className="h-4 w-4" />}Send {n} Email{n === 1 ? '' : 's'}</button>
      </PageHeader>

      {sender && !sender.configured && (
        <div className="flex items-center gap-2 text-warn bg-warn-soft rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" /> {sender.needsReconnect ? 'Your Gmail connection expired or was revoked.' : 'Connect your Gmail account before sending.'} <Link to="/settings" className="underline font-medium">{sender.needsReconnect ? 'Reconnect' : 'Connect Gmail'} in Settings</Link>
        </div>
      )}
      {missing.length > 0 && (
        <div className="flex items-start gap-2 text-warn bg-warn-soft rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Some variables are empty and will be blank in the email: {missing.map((m) => <b key={m.v} className="mr-2">{`{{${m.v}}}`} ({m.n} recipient{m.n > 1 ? 's' : ''})</b>)}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-base">Email Preview</h2>
            <select className="input !w-auto max-w-[240px] !py-1.5" value={Math.min(idx, n - 1)} onChange={(e) => setIdx(Number(e.target.value))} aria-label="Preview as recipient">
              {recipients.map((x, i) => <option key={x.email} value={i}>{x.name ? `${x.name} · ` : ''}{x.email}</option>)}
            </select>
          </div>
          <dl className="grid grid-cols-[64px_1fr] gap-y-1.5 text-[13px] pb-4 mb-4 border-b border-line">
            <dt className="text-muted">From:</dt><dd>{sender?.email ? `${sender.name} <${sender.email}>` : '—'}</dd>
            <dt className="text-muted">To:</dt><dd>{r.email}</dd>
            <dt className="text-muted">Subject:</dt><dd className="font-medium">{render(c.subject, vars)}</dd>
          </dl>
          <div className="rich leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: render(c.body, vars, true) }} />
          {c.attachments.length > 0 && (
            <div className="mt-5 pt-4 border-t border-line">
              <p className="text-xs text-muted mb-2">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {c.attachments.map((a) => <span key={a.id} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[13px]"><Paperclip className="h-3.5 w-3.5" />{a.filename}</span>)}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4 flex gap-3"><IconTile icon={Users} /><div><p className="text-xs text-muted">Recipients</p><p className="text-xl font-semibold">{n}</p><p className="text-xs text-muted">individual emails will be sent</p></div></div>
          <div className="card p-4 flex gap-3"><IconTile icon={Paperclip} tone="muted" /><div className="min-w-0"><p className="text-xs text-muted">Attachments</p><p className="text-xl font-semibold">{c.attachments.length} file{c.attachments.length === 1 ? '' : 's'}</p><p className="text-xs text-muted truncate">{c.attachments.map((a) => a.filename).join(', ') || 'None'}</p></div></div>
          <div className="card p-4 flex gap-3"><IconTile icon={Braces} tone="warn" /><div className="min-w-0"><p className="text-xs text-muted">Personalization</p><p className="text-xl font-semibold">{keys.length} variable{keys.length === 1 ? '' : 's'}</p><p className="text-xs text-muted truncate">{keys.join(', ') || 'None used'}</p></div></div>
        </div>
      </div>

      {campaignId && <SendingModal campaignId={campaignId} onDone={finished} />}
    </>
  );
}
