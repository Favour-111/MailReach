import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { Modal } from './ui';
import { isEmail, normalizeKey } from '../lib/vars';

const FIELDS = [
  { key: 'email', label: 'Email', hints: ['email', 'e_mail', 'email_address', 'mail'] },
  { key: 'name', label: 'Name', hints: ['name', 'full_name', 'fullname', 'contact', 'first_name'] },
  { key: 'company', label: 'Company', hints: ['company', 'organization', 'organisation', 'employer'] },
  { key: 'position', label: 'Position', hints: ['position', 'role', 'job_title', 'title', 'job'] },
];

const detect = (headers) =>
  Object.fromEntries(FIELDS.map((f) => [f.key, headers.find((h) => f.hints.includes(normalizeKey(h))) || '']));

export default function CsvImport({ onImport, onClose }) {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null); // { headers, rows }
  const [map, setMap] = useState({});
  const [error, setError] = useState('');

  const read = (f) => {
    setError('');
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setError('CSV is too large (max 2 MB)');
    Papa.parse(f, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const headers = (res.meta.fields || []).filter(Boolean);
        if (!headers.length || !res.data.length) return setError('Could not find any rows in this file');
        setFile(f);
        setParsed({ headers, rows: res.data });
        setMap(detect(headers));
      },
      error: () => setError('Could not read this file'),
    });
  };

  const result = useMemo(() => {
    if (!parsed || !map.email) return null;
    const mapped = new Set(Object.values(map).filter(Boolean));
    const extraCols = parsed.headers.filter((h) => !mapped.has(h));
    const valid = [];
    let invalid = 0;
    for (const row of parsed.rows) {
      const email = String(row[map.email] ?? '').trim().toLowerCase();
      if (!isEmail(email)) { invalid++; continue; }
      const data = {};
      for (const h of extraCols) if (row[h]?.trim()) data[normalizeKey(h)] = row[h].trim();
      valid.push({
        email,
        name: (map.name && row[map.name]?.trim()) || '',
        company: (map.company && row[map.company]?.trim()) || '',
        position: (map.position && row[map.position]?.trim()) || '',
        data,
      });
    }
    return { valid, invalid, extraCols };
  }, [parsed, map]);

  return (
    <Modal title="Import CSV" subtitle="Upload a CSV with a header row, then match the columns." onClose={onClose} wide>
      {!parsed ? (
        <>
          <button
            onClick={() => input.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); read(e.dataTransfer.files[0]); }}
            className="w-full rounded-xl border border-dashed border-line py-10 grid place-items-center gap-2 text-muted hover:bg-primary-soft hover:text-primary"
          >
            <Upload className="h-6 w-6" />
            <span className="font-medium">Click to choose a CSV file, or drop it here</span>
            <span className="text-xs">Example columns: name, email, company, position</span>
          </button>
          <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => read(e.target.files[0])} />
          {error && <p className="text-danger mt-3">{error}</p>}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted"><FileSpreadsheet className="h-4 w-4" />{file.name} · {parsed.rows.length} rows</div>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="label">{f.label} column{f.key === 'email' && ' *'}</label>
                <select className="input" value={map[f.key]} onChange={(e) => setMap({ ...map, [f.key]: e.target.value })}>
                  <option value="">{f.key === 'email' ? 'Select column…' : '— none —'}</option>
                  {parsed.headers.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          {result && (
            <>
              {result.extraCols.length > 0 && (
                <p className="text-xs text-muted">
                  Other columns become extra variables: {result.extraCols.map((c) => <code key={c} className="mx-0.5">{`{{${normalizeKey(c)}}}`}</code>)}
                </p>
              )}
              <div className="rounded-lg border border-line overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-subtle"><tr>{['Name', 'Email', 'Company', 'Position'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-line">
                    {result.valid.slice(0, 5).map((r) => (
                      <tr key={r.email}><td className="td">{r.name}</td><td className="td">{r.email}</td><td className="td">{r.company}</td><td className="td">{r.position}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm"><span className="text-ok font-medium">{result.valid.length} valid</span>
                {result.invalid > 0 && <span className="text-danger font-medium"> · {result.invalid} invalid email{result.invalid > 1 && 's'} will be skipped</span>}</p>
            </>
          )}
          <div className="flex justify-between pt-2">
            <button className="btn-ghost" onClick={() => setParsed(null)}>Choose another file</button>
            <button className="btn-primary" disabled={!result?.valid.length} onClick={() => { onImport(result.valid); onClose(); }}>
              Import {result?.valid.length || ''} recipients
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
