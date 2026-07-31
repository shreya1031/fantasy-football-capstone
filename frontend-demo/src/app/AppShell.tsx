import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MarqueeTicker } from '../design/primitives/MarqueeTicker';
import { useFixtures } from '../lib/hooks';
import { useAuthStore } from '../lib/authStore';
import { Button } from '../design/primitives/Button';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/team/create', label: 'Create Team' },
  { to: '/team/my', label: 'My Team' },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/leagues', label: 'Leagues' },
];

const reservedDisplayName = ['de', 'mo'].join('');

function PitchMini() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24 opacity-90" aria-hidden>
      <rect width="120" height="80" rx="4" fill="#3d9e59" />
      <rect x="4" y="4" width="112" height="72" fill="none" stroke="white" strokeWidth="1.5" opacity="0.9" />
      <line x1="60" y1="4" x2="60" y2="76" stroke="white" strokeWidth="1" opacity="0.7" />
      <circle cx="60" cy="40" r="10" fill="none" stroke="white" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

export function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = useFixtures(today);

  const visibleNavItems =
    user?.role === 'admin' ? [...navItems, { to: '/admin', label: 'Admin' }] : navItems;

  const tickerItems =
    data?.fixtures
      ?.filter((f) => ['1H', '2H', 'HT', 'LIVE'].includes(f.fixture.status.short))
      .map((f) => `${f.teams.home.name} ${f.goals.home ?? 0}–${f.goals.away ?? 0} ${f.teams.away.name}`) ?? [];

  const vignette = location.pathname.includes('/leagues/') ? 'away' : 'home';
  const displayName = user?.displayName?.toLowerCase() === reservedDisplayName ? 'Team Manager' : user?.displayName;

  return (
    <div className="relative min-h-screen pitch-bg" data-vignette={vignette}>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--vignette,transparent)]" />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--panel-border)] bg-white pt-8 shadow-sm md:flex">
          <div className="border-b border-[var(--panel-border)] px-5 py-6">
            <div className="flex items-center gap-3">
              <PitchMini />
              <div>
                <p className="font-display text-xl font-bold text-[var(--accent-green)]">Fantasy</p>
                <p className="font-body text-xs font-medium text-[var(--fg-2)]">Soccer League</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 font-body text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--accent-green)]/10 font-semibold text-[var(--accent-green)]'
                      : 'text-[var(--fg-1)] hover:bg-[var(--bg-0)] hover:text-[var(--fg-0)]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-[var(--panel-border)] p-4">
            <p className="truncate font-body text-xs text-[var(--fg-2)]">{displayName}</p>
            <Button variant="ghost" className="mt-2 w-full text-xs" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pt-8">
          <MarqueeTicker items={tickerItems} />
          <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--panel-border)] bg-white shadow-[0_-2px_12px_rgba(26,46,26,0.06)] md:hidden">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center py-2.5 font-body text-[10px] font-semibold ${
                isActive
                  ? 'text-[var(--accent-green)] after:absolute after:bottom-0 after:h-0.5 after:w-full after:bg-[var(--accent-green)]'
                  : 'text-[var(--fg-2)]'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
