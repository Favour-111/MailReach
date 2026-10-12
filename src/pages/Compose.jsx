import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, FileText, Paperclip, Upload, X, Mail, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { useCompose } from '../compose';
import { useSender } from '../lib/useSender';
import { customKeys, isBlank } from '../lib/vars';
import { fmtSize } from '../lib/format';
import RichEditor from '../components/RichEditor';
import { PageHeader, PageLoader, Spinner, useToast } from '../components/ui';

const MAX_TOTAL = 4 * 1024 * 1024; // keep in sync with server config (Brevo limit)

export default function Compose() {
  const c = useCompose();
  const nav = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const sender = useSender();
  const [loading, setLoading] = useState(Boolean(params.get('draft') || params.get('template')));
  const [uploading, setUploading] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    const draft = params.get('draft');
    const template = params.get('template');
    if (!draft && !template) return;
    (async () => {
      try {
        if (draft) await c.loadDraft(draft);
        else {
          const { templates } = await api.get('/templates');
          const t = templates.find((x) => x.id === template);
          if (t) c.update({ draftId: null, subject: t.subject, body: t.body, recipients: [], attachments: [] });
        }
      } catch (e) {
        toast(e.message, 'error');
      } finally {
        setParams({}, { replace: true });
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = async (files) => {
    let total = c.attachments.reduce((n, a) => n + a.size, 0);
    for (const file of files) {
      if (total + file.size > MAX_TOTAL) {
        toast(`${file.name} would exceed the attachment size limit (${fmtSize(MAX_TOTAL)} total)`, 'error');
        continue;
      }
      total += file.size;
      const key = Math.random();
      setUploading((u) => [...u, { key, name: file.name }]);
      try {
        const { attachment } = await api.upload(file);
        c.update((s) => ({ attachments: [...s.attachments, attachment] }));
      } catch (e) {
        total -= file.size;
        toast(`${file.name}: ${e.message}`, 'error');
      } finally {
        setUploading((u) => u.filter((x) => x.key !== key));
      }
    }
  };

  const removeFile = async (a) => {
    c.update((s) => ({ attachments: s.attachments.filter((x) => x.id !== a.id) }));
    api.del(`/attachments/${a.id}`).catch(() => {});
  };

  const saveDraft = async () => {
    setSaving(true);
    try { await c.saveDraft(); toast('Draft saved'); } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };

  const go = (path) => {
    if (!c.subject.trim() || isBlank(c.body)) return toast('Add a subject and email content first', 'error');
    nav(path);
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader title="Compose Email" subtitle="Create and send your email to multiple recipients.">
        <button className="btn-secondary" onClick={saveDraft} disabled={saving}>{saving && <Spinner />}Save Draft</button>
        <button className="btn-secondary" onClick={() => go('/compose/preview')}>Preview</button>
        <button className="btn-primary" onClick={() => go('/compose/recipients')}>Next <ArrowRight className="h-4 w-4" /></button>
      </PageHeader>

      <div className="card p-5 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-[120px_1fr] gap-x-4 gap-y-1.5 items-center">
          <label className="label !mb-0">From</label>
          {sender?.configured === false ? (
            <div className="flex items-center gap-2 text-warn bg-warn-soft rounded-lg px-3 py-2 w-fit">
              <AlertCircle className="h-4 w-4" /> {sender.needsReconnect ? 'Your Gmail connection expired.' : 'Gmail is not connected.'} <Link to="/settings" className="underline font-medium">{sender.needsReconnect ? 'Reconnect' : 'Connect Gmail'} in Settings</Link>
            </div>
          ) : (
            <div className="input flex items-center gap-2 !w-full sm:!max-w-md bg-subtle">
              <Mail className="h-4 w-4 text-primary" />{sender ? `${sender.name} <${sender.email}>` : '…'}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-[120px_1fr] gap-x-4 gap-y-1.5 items-center">
          <label className="label !mb-0" htmlFor="subject">Subject</label>
          <input id="subject" className="input" value={c.subject} onChange={(e) => c.update({ subject: e.target.value })} placeholder="Application for {{position}} Position" />
        </div>

        <div className="grid sm:grid-cols-[120px_1fr] gap-x-4 gap-y-1.5">
          <label className="label sm:pt-2">Email Content</label>
          <RichEditor value={c.body} onChange={(body) => c.update({ body })} extraVars={customKeys(c.recipients)} minHeight={260} />
        </div>

        <div className="grid sm:grid-cols-[120px_1fr] gap-x-4 gap-y-1.5">
          <label className="label sm:pt-2">Attachments</label>
          <div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button" onClick={() => fileInput.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addFiles([...e.dataTransfer.files]); }}
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-4 text-primary font-medium hover:bg-primary-soft"
              >
                <Upload className="h-4 w-4" /> Upload files
              </button>
              {c.attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-danger-soft text-danger grid place-items-center"><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{a.filename}</p>
                    <p className="text-xs text-muted">{fmtSize(a.size)}</p>
                  </div>
                  <button onClick={() => removeFile(a)} aria-label={`Remove ${a.filename}`} className="btn-ghost !p-1"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {uploading.map((u) => (
                <div key={u.key} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-muted">
                  <Spinner /> <span className="truncate">{u.name}</span>
                </div>
              ))}
            </div>
            <input ref={fileInput} type="file" multiple hidden onChange={(e) => { addFiles([...e.target.files]); e.target.value = ''; }} />
            <p className="text-xs text-muted mt-2 flex items-center gap-1"><Paperclip className="h-3 w-3" /> PDF, Word, Excel, images and more · up to {fmtSize(MAX_TOTAL)} total (Brevo limit)</p>
          </div>
        </div>
      </div>
    </>
  );
}
