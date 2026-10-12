import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, LayoutTemplate, MoreVertical, Plus, Sparkles } from 'lucide-react';
import { api } from '../api';
import { useCompose } from '../compose';
import RichEditor from '../components/RichEditor';
import { Empty, Menu, MenuItem, Modal, PageHeader, PageLoader, Spinner, useConfirm, useToast } from '../components/ui';
import { isBlank } from '../lib/vars';

function TemplateForm({ template, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ name: template?.name || '', subject: template?.subject || '', body: template?.body || '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (isBlank(f.body)) return toast('Template body is empty', 'error');
    setBusy(true);
    try {
      if (template?.id) await api.put(`/templates/${template.id}`, f);
      else await api.post('/templates', f);
      onSaved();
    } catch (err) {
      toast(err.message, 'error');
      setBusy(false);
    }
  };

  return (
    <Modal wide title={template?.id ? 'Edit template' : template ? 'Review AI template' : 'New template'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Template name</label><input className="input" required autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Job Application" /></div>
        <div><label className="label">Subject</label><input className="input" required value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Application for {{position}} Position" /></div>
        <div><label className="label">Body</label><RichEditor value={f.body} onChange={(body) => setF((s) => ({ ...s, body }))} minHeight={180} /></div>
        <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy}>{busy && <Spinner />}Save template</button></div>
      </form>
    </Modal>
  );
}

const TONES = ['professional', 'friendly', 'confident', 'formal'];
const IDEAS = ['Apply for a frontend developer role and mention my attached CV', 'Follow up a week after applying with no reply', 'Ask a contact for a referral at their company'];

function AiModal({ onClose, onGenerated }) {
  const toast = useToast();
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { template } = await api.post('/templates/generate', { prompt, tone });
      onGenerated(template);
    } catch (err) {
      toast(err.message, 'error');
      setBusy(false);
    }
  };

  return (
    <Modal title="Generate with AI" subtitle="Describe the email and AI will draft a reusable template with personalization variables." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="ai-prompt">What should the email do?</label>
          <textarea id="ai-prompt" className="input min-h-28" autoFocus required minLength={5} maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. Apply for a marketing role and mention my attached portfolio" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {IDEAS.map((i) => <button type="button" key={i} onClick={() => setPrompt(i)} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:bg-subtle hover:text-ink">{i}</button>)}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="ai-tone">Tone</label>
          <select id="ai-tone" className="input capitalize" value={tone} onChange={(e) => setTone(e.target.value)}>{TONES.map((t) => <option key={t}>{t}</option>)}</select>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? <Spinner /> : <Sparkles className="h-4 w-4" />}Generate</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Templates() {
  const nav = useNavigate();
  const toast = useToast();
  const { reset } = useCompose();
  const [confirm, dialog] = useConfirm();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null); // null | 'new' | 'ai' | template (a draft without id is an unsaved AI result)
  const [adding, setAdding] = useState(false);
  const load = () => api.get('/templates').then((d) => setList(d.templates));
  useEffect(() => { load(); }, []);
  if (!list) return <PageLoader />;

  const remove = async (t) => {
    if (!(await confirm({ title: 'Delete template?', message: `"${t.name}" will be permanently deleted.` }))) return;
    await api.del(`/templates/${t.id}`);
    toast('Template deleted');
    load();
  };
  const addStarters = async () => {
    setAdding(true);
    try {
      const { added } = await api.post('/templates/starters');
      toast(added ? `${added} starter template${added > 1 ? 's' : ''} added` : 'You already have all the starter templates');
      load();
    } catch (e) { toast(e.message, 'error'); } finally { setAdding(false); }
  };
  const use = (t) => { reset(); nav(`/compose?template=${t.id}`); };

  return (
    <>
      <PageHeader title="Email Templates" subtitle="Save and reuse your email templates.">
        <button className="btn-secondary" onClick={addStarters} disabled={adding}>{adding ? <Spinner /> : <LayoutTemplate className="h-4 w-4" />}Starter templates</button>
        <button className="btn-secondary" onClick={() => setForm('ai')}><Sparkles className="h-4 w-4" /> Generate with AI</button>
        <button className="btn-primary" onClick={() => setForm('new')}><Plus className="h-4 w-4" /> New Template</button>
      </PageHeader>
      <div className="card divide-y divide-line">
        {list.length === 0 && <Empty icon={FileText} title="No templates yet">Add the starter templates, generate one with AI, or write your own with variables such as {'{{name}}'}.</Empty>}
        {list.map((t) => (
          <div key={t.id} className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-4">
            <div className="hidden sm:grid h-10 w-10 shrink-0 rounded-xl bg-primary-soft text-primary place-items-center"><FileText className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{t.name}</p>
              <p className="text-xs text-muted truncate">{t.subject}</p>
            </div>
            <button className="btn-secondary" onClick={() => use(t)}>Use</button>
            <Menu align="right" trigger={<button className="btn-ghost !p-2" aria-label="More actions"><MoreVertical className="h-4 w-4" /></button>}>
              <MenuItem onClick={() => setForm(t)}>Edit</MenuItem>
              <MenuItem danger onClick={() => remove(t)}>Delete</MenuItem>
            </Menu>
          </div>
        ))}
      </div>
      {form === 'ai' && <AiModal onClose={() => setForm(null)} onGenerated={setForm} />}
      {form && form !== 'ai' && <TemplateForm template={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); toast('Template saved'); }} />}
      {dialog}
    </>
  );
}
