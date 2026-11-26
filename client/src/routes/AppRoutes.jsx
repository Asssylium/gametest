import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import Layout from '../components/layout/Layout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import GamesPage from '../pages/games/GamesPage.jsx';
import VendorPage from '../pages/vendor/VendorPage.jsx';
import AccountsPage from '../pages/accounts/AccountsPage.jsx';
import EmailPage from '../pages/EmailPage.jsx';
import PlaceholderPage from '../pages/PlaceholderPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import TestPerformance from '../Test/Performance.test.jsx';
import WalletPage from '../pages/wallet/WalletPage.jsx';
import AdminInboxPage from '../pages/inbox/AdminInboxPage.jsx';
import MessengerWidget from '../components/common/MessengerWidget.jsx';

const ContactPage = lazy(() => import('../pages/ContactPage.jsx'));

export const MENU = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦', render: () => <DashboardPage /> },
  { key: 'games', label: 'Games', icon: '🎮', render: () => <GamesPage /> },
  { key: 'wallet', label: 'Ví của tôi', icon: '💳', render: () => <WalletPage /> },
  { key: 'vendors', label: 'Vendors', icon: '🏢', render: () => <VendorPage /> },
  { key: 'accounts', label: 'Accounts', icon: '👥', render: () => <AccountsPage /> },
  { key: 'emails', label: 'Lên lịch Mail', icon: '✉️', render: () => <EmailPage /> },
  { key: 'inbox', label: 'Hộp thư', icon: '📬', render: () => <AdminInboxPage /> },
  {
    key: 'contact',
    label: 'Liên hệ',
    icon: '📍',
    render: () => (
      <Suspense fallback={<div style={{ padding: 24 }}>Đang tải bản đồ...</div>}>
        <ContactPage />
      </Suspense>
    ),
  },
  { key: 'settings', label: 'Settings', icon: '⚙', render: () => <PlaceholderPage title="Settings" /> },
];

const MainLayoutWrapper = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentKey = location.pathname.substring(1) || 'games';
  const isProfile = currentKey === 'profile';

  const visibleMenu = MENU.filter((item) => {
    if (
      (item.key === 'dashboard' || item.key === 'vendors' || item.key === 'accounts' || item.key === 'inbox') &&
      user?.roleId !== 1
    ) {
      return false;
    }
    if (item.key === 'emails' && user?.roleId !== 1 && user?.roleId !== 2) {
      return false;
    }
    return true;
  });

  const page = isProfile ? null : visibleMenu.find((item) => item.key === currentKey) || visibleMenu[0];

  return (
    <>
      <Layout menu={visibleMenu} current={isProfile ? '' : page.key} onNavigate={(key) => navigate(`/${key}`)}>
        {isProfile ? (
          <ProfilePage />
        ) : page.key === 'vendors' || page.key === 'dashboard' || page.key === 'accounts' || page.key === 'inbox' ? (
          <ProtectedRoute allowedRoles={[1]}>{page.render()}</ProtectedRoute>
        ) : (
          page.render()
        )}
      </Layout>
      <MessengerWidget />
    </>
  );
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/test" element={<TestPerformance />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<MainLayoutWrapper />} />
      </Route>
    </Routes>
  );
}
