import { useSyncExternalStore } from 'react';

const root = document.documentElement;
const subscribe = (cb) => {
  const obs = new MutationObserver(cb);
  obs.observe(root, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
};

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, () => root.classList.contains('dark'));
  const setDark = (v) => {
    root.classList.toggle('dark', v);
    try { localStorage.setItem('theme', v ? 'dark' : 'light'); } catch { /* ignore */ }
  };
  return [dark, setDark];
}
