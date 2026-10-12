import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePen, Trash2, Users, Paperclip } from 'lucide-react';
import { api } from '../api';
import { Empty, PageHeader, PageLoader, useConfirm, useToast } from '../components/ui';
import { fmtDate } from '../lib/format';

export default function Drafts() {
  const nav = useNavigate();
  const toast = useToast();
  const [confirm, dialog] = useConfirm();
  const [drafts, setDrafts] = useState(null);
  useEffect(() => { api.get('/drafts').then((d) => setDrafts(d.drafts)); }, []);
  if (!drafts) return <PageLoader />;

  const remove = async (d) => {
    if (!(await confirm({ title: 'Delete draft?', message: `"${d.subject || 'Untitled draft'}" will be permanently deleted.` }))) return;
    await api.del(`/drafts/${d.id}`);
    setDrafts((list) => list.filter((x) => x.id !== d.id));
    toast('Draft deleted');
  };

  return (
    <>
      <PageHeader title="Drafts" subtitle="Unfinished emails you can pick up later." />
      <div className="card divide-y divide-line">
        {drafts.length === 0 && <Empty icon={FilePen} title="No drafts">Use “Save Draft” while composing to keep your work.</Empty>}
        {drafts.map((d) => (
          <div key={d.id} className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-4">
            <div className="hidden sm:grid h-10 w-10 shrink-0 rounded-xl bg-primary-soft text-primary place-items-center"><FilePen className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{d.subject || 'Untitled draft'}</p>
              <p className="text-xs text-muted flex flex-wrap gap-x-3">
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{d.recipientCount}</span>
                <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{d.attachmentCount}</span>
                <span>Created {fmtDate(d.createdAt)} · edited {fmtDate(d.updatedAt)}</span>
              </p>
            </div>
            <button className="btn-secondary" onClick={() => nav(`/compose?draft=${d.id}`)}>Continue</button>
            <button className="btn-ghost !p-2 hover:!text-danger" onClick={() => remove(d)} aria-label="Delete draft"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      {dialog}
    </>
  );
}
