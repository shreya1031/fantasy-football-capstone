import { Link } from 'react-router-dom';
import { MotionPage, Stat } from '../../design/primitives/Stat';
import { Panel } from '../../design/primitives/Panel';
import { Button } from '../../design/primitives/Button';
import { BadgeChip } from '../../design/primitives/BadgeChip';
import { LoadingState, ErrorState, EmptyState } from '../../design/primitives/States';
import { useTeams, useLeagues, useUpcomingFixtures, useTeamScore } from '../../lib/hooks';

function kickoffDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function kickoffTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function DashboardPage() {
  const { data: teams, isLoading: teamsLoading, error: teamsError, refetch: refetchTeams } = useTeams();
  const { data: leagues, isLoading: leaguesLoading } = useLeagues();
  const { data: upcoming = [], isLoading: fixturesLoading } = useUpcomingFixtures(10);

  const primaryTeam = teams?.[0];
  const { data: scoreData } = useTeamScore(primaryTeam?._id);

  if (teamsLoading) return <LoadingState message="Loading dashboard" />;
  if (teamsError) return <ErrorState message="Failed to load dashboard" onRetry={() => refetchTeams()} />

  return (
    <MotionPage className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="font-body text-sm font-medium text-[var(--fg-2)]">Gameweek {scoreData?.gameweek ?? '—'}</p>
        <h1 className="font-display text-3xl font-bold text-[var(--fg-0)]">Dashboard</h1>
      </header>

      {primaryTeam && (
        <div className="flex flex-wrap gap-8 rounded-xl border border-[var(--panel-border)] bg-white p-6 shadow-[var(--card-shadow)]">
          <Stat label="GW Points" value={scoreData?.score.points ?? 0} />
          <Stat label="Total" value={scoreData?.score.points ?? 0} />
          <Stat label="Rank" value={1} suffix="st" accent="orange" />
        </div>
      )}

      <Panel
        title="My Team"
        action={
          primaryTeam ? (
            <Link to="/team/my">
              <Button variant="ghost" className="text-xs">
                View Team
              </Button>
            </Link>
          ) : (
            <Link to="/team/create">
              <Button className="text-xs">Create Team</Button>
            </Link>
          )
        }
      >
        {primaryTeam ? (
          <div>
            <h3 className="font-display text-xl font-semibold">{primaryTeam.name}</h3>
            <p className="mt-1 font-body text-sm text-[var(--fg-2)]">
              {primaryTeam.formation} · {primaryTeam.players.length} players
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {primaryTeam.players.slice(0, 5).map((p) => (
                <BadgeChip key={p.apiPlayerId} tone={p.isCaptain ? 'amber' : 'muted'}>
                  {p.name.split(' ').pop()}
                </BadgeChip>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No team yet"
            description="Create your first squad to start competing."
            action={
              <Link to="/team/create">
                <Button>Create Fantasy Team</Button>
              </Link>
            }
          />
        )}
      </Panel>

      <Panel
        title="Live & Upcoming"
        action={
          <Link to="/fixtures?view=schedule">
            <Button variant="ghost" className="text-xs">
              All Fixtures
            </Button>
          </Link>
        }
      >
        {fixturesLoading ? (
          <LoadingState message="Loading fixtures" />
        ) : upcoming.length ? (
          <ul className="space-y-2">
            {upcoming.map((f) => {
              const live = ['1H', '2H', 'HT', 'LIVE'].includes(f.fixture.status.short);
              return (
                <li
                  key={f.fixture.id}
                  className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border px-4 py-3 ${
                    live ? 'border-red-200 bg-red-50' : 'border-[var(--panel-border)] bg-[var(--bg-0)]/50'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2 font-body text-sm">
                    {f.teams.home.logo && (
                      <img src={f.teams.home.logo} alt="" className="h-5 w-5 object-contain" />
                    )}
                    <span className="truncate">{f.teams.home.name}</span>
                    <span className="text-[var(--fg-2)]">vs</span>
                    {f.teams.away.logo && (
                      <img src={f.teams.away.logo} alt="" className="h-5 w-5 object-contain" />
                    )}
                    <span className="truncate">{f.teams.away.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {f.matchday != null && <BadgeChip tone="muted">GW {f.matchday}</BadgeChip>}
                    {live ? (
                      <>
                        <BadgeChip tone="orange">Live</BadgeChip>
                        <span className="font-stat text-lg font-semibold">
                          {f.goals.home ?? 0} – {f.goals.away ?? 0}
                        </span>
                      </>
                    ) : (
                      <span className="font-stat text-sm font-semibold text-[var(--fg-1)]">
                        {kickoffDay(f.fixture.date)} · {kickoffTime(f.fixture.date)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="No upcoming fixtures" description="Check back closer to matchday." />
        )}
      </Panel>

      <Panel
        title="My Leagues"
        action={
          <Link to="/leagues">
            <Button variant="ghost" className="text-xs">
              Open Leaderboard
            </Button>
          </Link>
        }
      >
        {leaguesLoading ? (
          <LoadingState message="Loading leagues" />
        ) : leagues?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {leagues.slice(0, 4).map((m) => (
              <Link
                key={m._id}
                to={`/leagues/${m.league._id}`}
                className="rounded-lg border border-[var(--panel-border)] bg-[var(--bg-0)]/50 p-4 transition-shadow hover:shadow-[var(--glow-green)]"
              >
                <h4 className="font-display font-semibold">{m.league.name}</h4>
                <p className="mt-1 font-stat text-sm font-semibold text-[var(--accent-green)]">{m.league.code}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No leagues joined"
            description="Create or join a league to compete with friends."
            action={
              <Link to="/leagues">
                <Button>Browse Leagues</Button>
              </Link>
            }
          />
        )}
      </Panel>
    </MotionPage>
  );
}
