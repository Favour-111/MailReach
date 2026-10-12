import { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, PenSquare, FileText, FilePen, History, Settings, Send, Menu, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../auth';
import { useTheme } from '../theme';
import { initials } from '../lib/format';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/compose', label: 'Compose', icon: PenSquare },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/drafts', label: 'Drafts', icon: FilePen },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold text-[15px]">
      <Send className="h-5 w-5 text-primary -rotate-12" /> MailReach
    </div>
  );
}

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const [dark, setDark] = useTheme();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-5"><Logo /></div>
      <nav className="flex-1 px-3 space-y-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-subtle hover:text-ink'
              }`}
          >
            <Icon className="h-[18px] w-[18px]" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 flex items-center gap-3 border-t border-line">
        <div className="h-9 w-9 shrink-0 rounded-full bg-primary-soft text-primary grid place-items-center text-xs font-semibold">{initials(user.name)}</div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate text-[13px]">{user.name}</p>
          <p className="text-muted text-xs truncate">{user.email}</p>
        </div>
        <button onClick={() => setDark(!dark)} className="btn-ghost !p-1.5" aria-label="Toggle dark mode">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button onClick={logout} className="btn-ghost !p-1.5" aria-label="Log out"><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  useLocation();
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:block w-60 shrink-0 border-r border-line bg-surface sticky top-0 h-screen">
        <Sidebar />
      </aside>

      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-surface border-b border-line px-4 h-14">
        <Link to="/"><Logo /></Link>
        <button className="btn-ghost !p-2" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/45" onClick={() => setOpen(false)}>
          <aside className="w-64 h-full bg-surface" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl"><Outlet /></div>
      </main>
    </div>
  );
}
