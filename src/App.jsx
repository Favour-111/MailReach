import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { ComposeProvider } from './compose';
import { ToastProvider } from './components/ui';
import { PageLoader } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Compose from './pages/Compose';
import Recipients from './pages/Recipients';
import Preview from './pages/Preview';
import { History, CampaignDetail } from './pages/History';
import Drafts from './pages/Drafts';
import Templates from './pages/Templates';
import Settings from './pages/Settings';

function Protected() {
  const { user } = useAuth();
  if (user === undefined) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ComposeProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<Protected />}>
                <Route index element={<Dashboard />} />
                <Route path="compose" element={<Compose />} />
                <Route path="compose/recipients" element={<Recipients />} />
                <Route path="compose/preview" element={<Preview />} />
                <Route path="templates" element={<Templates />} />
                <Route path="drafts" element={<Drafts />} />
                <Route path="history" element={<History />} />
                <Route path="history/:id" element={<CampaignDetail />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ComposeProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
