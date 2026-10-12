export const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// Derive a display status from campaign counts
export function campaignStatus(c) {
  if (c.status === 'sending') return { label: 'Sending', tone: 'primary' };
  if (c.status === 'cancelled') return { label: 'Cancelled', tone: 'muted' };
  if (c.failedCount === 0) return { label: 'Sent', tone: 'ok' };
  if (c.successfulCount === 0) return { label: 'Failed', tone: 'danger' };
  return { label: `Partial (${c.failedCount} failed)`, tone: 'warn' };
}
