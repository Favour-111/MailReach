import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, History as HistoryIcon, Paperclip, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Badge, Empty, PageHeader, PageLoader, Spinner, useToast } from '../components/ui';
import { campaignStatus, fmtDate, fmtSize } from '../lib/format';

export function History() {
  const nav = useNavigate();
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/campaigns').then((d) => setList(d.campaigns)); }, []);
  if (!list) return <PageLoader />;

  return (
    <>
      <PageHeader title="Email History" subtitle="View all your sent emails and their status." />
      <div className="card overflow-hidden">
        {list.length === 0 ? (
          <Empty icon={HistoryIcon} title="No emails sent yet">Emails you send will show up here.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-subtle"><tr>
                <th className="th">Subject</th><th className="th">Recipients</th><th className="th">Successful</th><th className="th">Failed</th><th className="th">Status</th><th className="th">Date</th><th className="th w-8" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {list.map((c) => {
                  const s = campaignStatus(c);
                  return (
                    <tr key={c.id} onClick={() => nav(`/history/${c.id}`)} className="cursor-pointer hover:bg-subtle/60">
                      <td className="td font-medium">{c.subject}</td>
                      <td className="td">{c.totalRecipients}</td>
                      <td className="td text-ok">{c.successfulCount}</td>
                      <td className={`td ${c.failedCount ? 'text-danger' : ''}`}>{c.failedCount}</td>
                      <td className="td"><Badge tone={s.tone}>{s.label}</Badge></td>
                      <td className="td text-muted whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                      <td className="td text-muted"><ChevronRight className="h-4 w-4" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export function CampaignDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [c, setC] = useState(null);
  const [filter, setFilter] = useState('all');
  const [retrying, setRetrying] = useState(false);

  const load = () => api.get(`/campaigns/${id}`).then((d) => setC(d.campaign)).catch((e) => toast(e.message, 'error'));
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (c?.status !== 'sending') return;
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [c?.status]);

  if (!c) return <PageLoader />;
  const s = campaignStatus(c);
  const rows = c.recipients.filter((r) => filter === 'all' || r.status === filter);
  const retry = async () => {
    setRetrying(true);
    try { await api.post(`/campaigns/${id}/retry`); await load(); } catch (e) { toast(e.message, 'error'); } finally { setRetrying(false); }
  };
  const tone = { sent: 'ok', failed: 'danger', pending: 'muted' };

  return (
    <>
      <Link to="/history" className="inline-flex items-center gap-1 text-muted hover:text-ink mb-3"><ArrowLeft className="h-4 w-4" /> History</Link>
      <PageHeader title={c.subject} subtitle={`${fmtDate(c.createdAt)} · ${c.totalRecipients} recipients`}>
        <Badge tone={s.tone}>{s.label}</Badge>
        {c.status !== 'sending' && c.failedCount > 0 && (
          <button className="btn-secondary" onClick={retry} disabled={retrying}>{retrying ? <Spinner /> : <RefreshCw className="h-4 w-4" />}Retry failed</button>
        )}
      </PageHeader>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
        {[['Total', c.totalRecipients, ''], ['Successful', c.successfulCount, 'text-ok'], ['Failed', c.failedCount, c.failedCount ? 'text-danger' : '']].map(([l, v, cls]) => (
          <div key={l} className="card p-3 sm:p-4 min-w-0"><p className="text-xs text-muted">{l}</p><p className={`text-2xl font-semibold ${cls}`}>{v}</p></div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex gap-1 p-3 border-b border-line overflow-x-auto">
          {['all', 'sent', 'failed', 'pending'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-subtle'}`}>{f}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-subtle"><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Company</th><th className="th">Status</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="td">{r.name || <span className="text-muted">—</span>}</td>
                  <td className="td">{r.email}</td>
                  <td className="td">{r.company || <span className="text-muted">—</span>}</td>
                  <td className="td">
                    <Badge tone={tone[r.status]}>{r.status === 'sent' ? 'Sent' : r.status === 'failed' ? 'Failed' : 'Not sent'}</Badge>
                    {r.errorMessage && <p className="text-xs text-danger mt-1">{r.errorMessage}</p>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="td text-muted text-center py-8" colSpan={4}>No recipients match this filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 mt-5">
        <h2 className="text-base mb-3">Message</h2>
        <div className="rich leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: c.body }} />
        {c.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line">
            {c.attachments.map((a) => <span key={a.id} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[13px]"><Paperclip className="h-3.5 w-3.5" />{a.filename} <span className="text-muted">{fmtSize(a.size)}</span></span>)}
          </div>
        )}
      </div>
    </>
  );
}
