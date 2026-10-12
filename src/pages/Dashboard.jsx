import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Send, AlertTriangle, FilePen, FileText, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useCompose } from '../compose';
import { Badge, IconTile, PageHeader, PageLoader } from '../components/ui';
import { campaignStatus, fmtDate } from '../lib/format';

export default function Dashboard() {
  const { user } = useAuth();
  const { reset } = useCompose();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/campaigns/stats').then(setStats); }, []);
  if (!stats) return <PageLoader />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const tiles = [
    { label: 'Emails Sent', value: stats.sent, icon: Send, tone: 'ok' },
    { label: 'Failed', value: stats.failed, icon: AlertTriangle, tone: 'danger' },
    { label: 'Drafts', value: stats.drafts, icon: FilePen, tone: 'primary' },
    { label: 'Templates', value: stats.templates, icon: FileText, tone: 'primary' },
  ];

  return (
    <>
      <PageHeader title={`${greeting}, ${user.name.split(' ')[0]} 👋`} subtitle="Here's an overview of your email activity.">
        <button className="btn-primary" onClick={() => { reset(); nav('/compose'); }}><Plus className="h-4 w-4" /> Compose Email</button>
      </PageHeader>

      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4 flex items-center gap-3">
            <IconTile icon={t.icon} tone={t.tone} />
            <div>
              <p className="text-2xl font-semibold leading-none">{t.value}</p>
              <p className="text-muted text-xs mt-1.5">{t.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base">Recent Emails</h2>
          <Link to="/history" className="text-primary text-xs font-medium inline-flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="text-muted text-center py-12 border-t border-line">Nothing sent yet. Compose your first email!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-subtle"><tr><th className="th">Subject</th><th className="th">Recipients</th><th className="th">Status</th><th className="th">Date</th></tr></thead>
              <tbody className="divide-y divide-line">
                {stats.recent.map((c) => {
                  const s = campaignStatus(c);
                  return (
                    <tr key={c.id} className="hover:bg-subtle/60">
                      <td className="td font-medium"><Link to={`/history/${c.id}`} className="hover:text-primary">{c.subject}</Link></td>
                      <td className="td">{c.totalRecipients}</td>
                      <td className="td"><Badge tone={s.tone}>{s.label}</Badge></td>
                      <td className="td text-muted">{fmtDate(c.createdAt)}</td>
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
