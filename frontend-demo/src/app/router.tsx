import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ProtectedRoute, GuestRoute, AdminRoute } from './ProtectedRoute';
import { LoadingState } from '../design/primitives/States';

const HomePage = lazy(() => import('../features/home/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('../features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CreateTeamPage = lazy(() => import('../features/team/create/CreateTeamPage').then((m) => ({ default: m.CreateTeamPage })));
const PlayerSelectionPage = lazy(() => import('../features/team/select/PlayerSelectionPage').then((m) => ({ default: m.PlayerSelectionPage })));
const MyTeamPage = lazy(() => import('../features/team/my/MyTeamPage').then((m) => ({ default: m.MyTeamPage })));
const LeaguesPage = lazy(() => import('../features/leagues/LeaguesPage').then((m) => ({ default: m.LeaguesPage })));
const FixturesPage = lazy(() => import('../features/fixtures/FixturesPage').then((m) => ({ default: m.FixturesPage })));
const LeagueDetailPage = lazy(() => import('../features/leagues/LeagueDetailPage').then((m) => ({ default: m.LeagueDetailPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const AdminPage = lazy(() => import('../features/admin/AdminPage').then((m) => ({ default: m.AdminPage })));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingState />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Lazy><HomePage /></Lazy>} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
        <Route path="/register" element={<Lazy><RegisterPage /></Lazy>} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Lazy><DashboardPage /></Lazy>} />
          <Route path="/team/create" element={<Lazy><CreateTeamPage /></Lazy>} />
          <Route path="/team/select" element={<Lazy><PlayerSelectionPage /></Lazy>} />
          <Route path="/team/my" element={<Lazy><MyTeamPage /></Lazy>} />
          <Route path="/fixtures" element={<Lazy><FixturesPage /></Lazy>} />
          <Route path="/leagues" element={<Lazy><LeaguesPage /></Lazy>} />
          <Route path="/leagues/:id" element={<Lazy><LeagueDetailPage /></Lazy>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Lazy><AdminPage /></Lazy>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
    </Routes>
  );
}
