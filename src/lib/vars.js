// Variable helpers. Mirrors server/src/template.js so the preview matches what is sent.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (s) => EMAIL_RE.test(String(s).trim());

export const BASE_VARS = ['name', 'company', 'position', 'sender_name'];

export const normalizeKey = (k) => String(k).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const VAR_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function render(str, vars, html = false) {
  return str.replace(VAR_RE, (_, k) => {
    const v = String(vars[k.toLowerCase()] ?? '').replace(/[\r\n]+/g, ' ');
    return html ? esc(v) : v;
  });
}

export function recipientVars(r, senderName) {
  const extra = {};
  for (const [k, v] of Object.entries(r.data || {})) extra[normalizeKey(k)] = v;
  return { ...extra, name: r.name, email: r.email, company: r.company, position: r.position, sender_name: senderName };
}

export const usedVars = (...strs) => [...new Set(strs.flatMap((s) => [...s.matchAll(VAR_RE)].map((m) => m[1].toLowerCase())))];

export const customKeys = (recipients) =>
  [...new Set(recipients.flatMap((r) => Object.keys(r.data || {}).map(normalizeKey)))].filter((k) => k && !BASE_VARS.includes(k) && k !== 'email');

export const isBlank = (html) => !html.replace(/<[^>]*>|&nbsp;|\s/g, '');
