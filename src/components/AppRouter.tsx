import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Index';
import TicketsPage from '../pages/TicketsPage';
import CreateTicketPage from '../pages/CreateTicketPage';
import TicketDetailPage from '../pages/TicketDetailPage';
import MapPage from '../pages/MapPage';
import ProfilePage from '../pages/ProfilePage';
import AdminSettingsPage from '../pages/AdminSettingsPage';
import EngineersPage from '../pages/EngineersPage';
import SupervisorsPage from '../pages/SupervisorsPage';
import AllUsersPage from '../pages/AllUsersPage';
import ResolvedTicketsPage from '../pages/ResolvedTicketsPage';
import NotFound from '../pages/NotFound';
import AppLayout from './AppLayout';
import { useAuth } from '../hooks/useAuth';
import AuthForm from './AuthForm';
import { ThemeProvider } from './theme-provider';
import ThemeToggle from './ThemeToggle';
import { Toaster } from './ui/sonner';
import { Loader2 } from 'lucide-react';

export default function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <div className="h-screen flex items-center justify-center relative">
          <div className="absolute top-4 right-4 z-10">
            <ThemeToggle />
          </div>
          <AuthForm onAuthSuccess={() => {}} />
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/:id" element={<TicketDetailPage />} />
            <Route path="create" element={<CreateTicketPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="engineers" element={<EngineersPage />} />
            <Route path="admin/supervisors" element={<SupervisorsPage />} />
            <Route path="admin/users" element={<AllUsersPage />} />
            <Route path="admin/resolved-tickets" element={<ResolvedTicketsPage />} />
            <Route path="admin/settings" element={<AdminSettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}
