import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    api.get('/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null));
  }, []);

  const login = useCallback(async (email, password) => setUser((await api.post('/auth/login', { email, password })).user), []);
  const register = useCallback(async (name, email, password) => setUser((await api.post('/auth/register', { name, email, password })).user), []);
  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    sessionStorage.removeItem('compose');
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}
