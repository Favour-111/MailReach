import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const tones = {
  ok: 'bg-ok-soft text-ok',
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-warn',
  primary: 'bg-primary-soft text-primary',
  muted: 'bg-subtle text-muted border border-line',
};

export function Badge({ tone = 'muted', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${tones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export const Spinner = ({ className = 'h-4 w-4' }) => <Loader2 className={`animate-spin ${className}`} />;

export function PageLoader() {
  return <div className="flex justify-center py-20 text-muted"><Spinner className="h-6 w-6" /></div>;
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <div className="h-12 w-12 rounded-full bg-primary-soft text-primary grid place-items-center mb-3"><Icon className="h-6 w-6" /></div>
      <p className="font-semibold">{title}</p>
      <p className="text-muted mt-1 max-w-sm">{children}</p>
    </div>
  );
}

export function IconTile({ icon: Icon, tone = 'primary' }) {
  return <div className={`h-11 w-11 shrink-0 rounded-xl grid place-items-center ${tones[tone]}`}><Icon className="h-5 w-5" /></div>;
}

export function Modal({ title, subtitle, onClose, children, wide, dismissible = true }) {
  useEffect(() => {
    if (!dismissible) return;
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, dismissible]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/45" onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose?.()}>
      <div role="dialog" aria-modal="true" className={`card shadow-pop w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] max-h-[90dvh] overflow-y-auto p-4 sm:p-6`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg">{title}</h2>
            {subtitle && <p className="text-muted mt-0.5">{subtitle}</p>}
          </div>
          {dismissible && <button onClick={onClose} aria-label="Close" className="btn-ghost !p-1.5"><X className="h-4 w-4" /></button>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const done = (v) => { state.resolve(v); setState(null); };
  const dialog = state && (
    <Modal title={state.title} onClose={() => done(false)}>
      <p className="text-muted mb-5">{state.message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={() => done(false)}>Cancel</button>
        <button className="btn-danger" onClick={() => done(true)}>{state.confirmLabel || 'Delete'}</button>
      </div>
    </Modal>
  );
  return [confirm, dialog];
}

// Small popover menu (also used by the editor toolbar; keeps editor selection via mousedown preventDefault)
export function Menu({ trigger, children, align = 'left', keepFocus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <div onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined} onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-30 mt-1 min-w-44 card shadow-pop p-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
          onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
export const MenuItem = ({ danger, ...p }) => (
  <button {...p} className={`w-full text-left rounded-md px-3 py-2 text-sm hover:bg-subtle ${danger ? 'text-danger' : ''}`} />
);

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[60] flex flex-col gap-2 items-stretch sm:items-end">
        {toasts.map((t) => (
          <div key={t.id} className="card shadow-pop flex items-center gap-2.5 px-4 py-3 w-full sm:w-auto sm:max-w-sm">
            {t.type === 'error' ? <AlertCircle className="h-4 w-4 text-danger shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-ok shrink-0" />}
            <span className="min-w-0 break-words">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
