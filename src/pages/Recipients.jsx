import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Mail, Pencil, Plus, Trash2, Upload, Users, X } from 'lucide-react';
import { useCompose } from '../compose';
import { isEmail } from '../lib/vars';
import CsvImport from '../components/CsvImport';
import { Empty, Modal, PageHeader, useToast } from '../components/ui';

const blank = { name: '', email: '', company: '', position: '' };

function RecipientForm({ initial = blank, onSave, onClose, title }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!isEmail(f.email)) return setErr('Enter a valid email address');
    onSave({ ...f, email: f.email.trim().toLowerCase() });
  };
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {[['name', 'Name'], ['email', 'Email *'], ['company', 'Company'], ['position', 'Position']].map(([k, label]) => (
          <div key={k}><label className="label">{label}</label><input className="input" autoFocus={k === 'name'} value={f[k]} onChange={set(k)} type={k === 'email' ? 'email' : 'text'} /></div>
        ))}
        {err && <p className="text-danger">{err}</p>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary">Save</button></div>
      </form>
    </Modal>
  );
}

export default function Recipients() {
  const { recipients, update } = useCompose();
  const nav = useNavigate();
  const toast = useToast();
  const [quick, setQuick] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null); // email being edited inline
  const [draft, setDraft] = useState(blank);
  const [modal, setModal] = useState(null); // 'add' | 'csv'

  const merge = (incoming) => {
    const have = new Set(recipients.map((r) => r.email));
    const fresh = incoming.filter((r) => !have.has(r.email) && have.add(r.email));
    update({ recipients: [...recipients, ...fresh] });
    const dupes = incoming.length - fresh.length;
    toast(`${fresh.length} recipient${fresh.length === 1 ? '' : 's'} added${dupes ? ` · ${dupes} duplicate${dupes > 1 ? 's' : ''} skipped` : ''}`);
  };

  // Type or paste emails; separators: Enter, comma, semicolon, whitespace
  const addQuick = (text) => {
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return;
    const valid = parts.filter(isEmail);
    const bad = parts.length - valid.length;
    if (valid.length) merge(valid.map((e) => ({ ...blank, email: e.toLowerCase(), data: {} })));
    if (bad) toast(`${bad} invalid address${bad > 1 ? 'es' : ''} ignored`, 'error');
    setQuick('');
  };

  const remove = (emails) => {
    const gone = new Set(emails);
    update({ recipients: recipients.filter((r) => !gone.has(r.email)) });
    setSelected(new Set());
  };

  const startEdit = (r) => { setEditing(r.email); setDraft({ name: r.name, email: r.email, company: r.company, position: r.position }); };
  const saveEdit = () => {
    const email = draft.email.trim().toLowerCase();
    if (!isEmail(email)) return toast('Enter a valid email address', 'error');
    if (email !== editing && recipients.some((r) => r.email === email)) return toast('That email is already in the list', 'error');
    update({ recipients: recipients.map((r) => (r.email === editing ? { ...r, ...draft, email } : r)) });
    setEditing(null);
  };

  const allSelected = recipients.length > 0 && selected.size === recipients.length;
  const toggle = (email) => setSelected((s) => { const n = new Set(s); n.has(email) ? n.delete(email) : n.add(email); return n; });
  const cell = (k) => <input className="input !py-1.5" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />;
  const next = () => (recipients.length ? nav('/compose/preview') : toast('Add at least one recipient', 'error'));

  return (
    <>
      <PageHeader title="Add Recipients" subtitle="Type or paste addresses, or import them from a CSV file.">
        <button className="btn-secondary" onClick={() => setModal('add')}><Plus className="h-4 w-4" /> Add Manually</button>
        <button className="btn-secondary !bg-primary !text-white hover:!bg-primary-hover !border-transparent" onClick={() => setModal('csv')}><Upload className="h-4 w-4" /> Import CSV</button>
      </PageHeader>

      <div className="card p-4 mb-4">
        <label className="label" htmlFor="quick">Quick add</label>
        <div className="flex gap-2">
          <input
            id="quick" className="input" value={quick} placeholder="hr@company.com — press Enter, or paste many addresses at once"
            onChange={(e) => setQuick(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addQuick(quick); } }}
            onPaste={(e) => { const t = e.clipboardData.getData('text'); if (/[\s,;]/.test(t.trim())) { e.preventDefault(); addQuick(t); } }}
          />
          <button className="btn-secondary" onClick={() => addQuick(quick)} disabled={!quick.trim()}>Add</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {recipients.length === 0 ? (
          <Empty icon={Users} title="No recipients yet">Add addresses above, or import a CSV with name, email, company and position columns.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-subtle">
                <tr>
                  <th className="th w-10"><input type="checkbox" aria-label="Select all" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(recipients.map((r) => r.email)))} /></th>
                  <th className="th">Name</th><th className="th">Email</th><th className="th">Company</th><th className="th">Position</th><th className="th w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recipients.map((r) => (editing === r.email ? (
                  <tr key={r.email} className="bg-primary-soft/40">
                    <td className="td" />
                    <td className="td">{cell('name')}</td><td className="td">{cell('email')}</td><td className="td">{cell('company')}</td><td className="td">{cell('position')}</td>
                    <td className="td"><div className="flex gap-1">
                      <button className="btn-ghost !p-1.5 text-ok" onClick={saveEdit} aria-label="Save"><Check className="h-4 w-4" /></button>
                      <button className="btn-ghost !p-1.5" onClick={() => setEditing(null)} aria-label="Cancel"><X className="h-4 w-4" /></button>
                    </div></td>
                  </tr>
                ) : (
                  <tr key={r.email} className="hover:bg-subtle/60">
                    <td className="td"><input type="checkbox" aria-label={`Select ${r.email}`} checked={selected.has(r.email)} onChange={() => toggle(r.email)} /></td>
                    <td className="td font-medium">{r.name || <span className="text-muted">—</span>}</td>
                    <td className="td"><span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted" />{r.email}</span></td>
                    <td className="td">{r.company || <span className="text-muted">—</span>}</td>
                    <td className="td">{r.position || <span className="text-muted">—</span>}</td>
                    <td className="td"><div className="flex gap-1">
                      <button className="btn-ghost !p-1.5" onClick={() => startEdit(r)} aria-label={`Edit ${r.email}`}><Pencil className="h-4 w-4" /></button>
                      <button className="btn-ghost !p-1.5 hover:!text-danger" onClick={() => remove([r.email])} aria-label={`Remove ${r.email}`}><Trash2 className="h-4 w-4" /></button>
                    </div></td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <span className="text-muted">{recipients.length} recipient{recipients.length === 1 ? '' : 's'}{selected.size > 0 && ` · ${selected.size} selected`}</span>
          <button className="btn-secondary" disabled={!selected.size} onClick={() => remove([...selected])}>Remove Selected</button>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button className="btn-secondary" onClick={() => nav('/compose')}><ArrowLeft className="h-4 w-4" /> Back</button>
        <button className="btn-primary" onClick={next}>Next: Preview <ArrowRight className="h-4 w-4" /></button>
      </div>

      {modal === 'add' && <RecipientForm title="Add recipient" onClose={() => setModal(null)} onSave={(r) => { merge([{ ...r, data: {} }]); setModal(null); }} />}
      {modal === 'csv' && <CsvImport onClose={() => setModal(null)} onImport={merge} />}
    </>
  );
}
