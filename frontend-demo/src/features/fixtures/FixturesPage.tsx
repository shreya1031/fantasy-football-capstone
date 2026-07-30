import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MotionPage } from '../../design/primitives/Stat';
import { Panel } from '../../design/primitives/Panel';
import { BadgeChip } from '../../design/primitives/BadgeChip';
import { LoadingState, ErrorState, EmptyState } from '../../design/primitives/States';
import { useFixtures, useFixture, useSeasonSchedule } from '../../lib/hooks';
import { DEFAULT_FIXTURE_DATE } from '../../lib/config';
import type { Fixture } from '../../lib/types';

const LIVE_STATUSES = ['1H', '2H', 'HT', 'LIVE'];
const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

function kickoffDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function kickoffTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function statusChip(f: Fixture) {
  const s = f.fixture.status.short;
  if (LIVE_STATUSES.includes(s)) return <BadgeChip tone="green">LIVE</BadgeChip>;
  if (FINISHED_STATUSES.includes(s)) return <BadgeChip tone="muted">FT</BadgeChip>;
  if (s === 'NS') return <BadgeChip tone="amber">Upcoming</BadgeChip>;
  return <BadgeChip tone="orange">{f.fixture.status.long}</BadgeChip>;
}

function TeamCell({ team, align = 'left' }: { team: Fixture['teams']['home']; align?: 'left' | 'right' }) {
  return (
    <span className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
      {align === 'left' && team.logo && <img src={team.logo} alt="" className="h-5 w-5 object-contain" />}
      <span className="truncate">{team.name}</span>
      {align === 'right' && team.logo && <img src={team.logo} alt="" className="h-5 w-5 object-contain" />}
    </span>
  );
}

function FixtureModal({ fixtureId, onClose }: { fixtureId: number; onClose: () => void }) {
  const { data: fixture, isLoading } = useFixture(String(fixtureId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--panel-border)] bg-[var(--bg-1)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !fixture ? (
          <LoadingState message="LOADING MATCH" />
        ) : (
          <>
            <h3 className="font-body text-xl font-semibold">
              {fixture.teams.home.name} vs {fixture.teams.away.name}
            </h3>
            <p className="mt-1 font-stat text-2xl text-[var(--accent-green)]">
              {fixture.goals.home ?? 0} – {fixture.goals.away ?? 0}
            </p>
            <ul className="mt-6 space-y-2">
              {(fixture.events ?? []).map((ev, i) => (
                <li key={i} className="flex gap-3 font-body text-sm">
                  <span className="font-stat text-[var(--fg-2)]">{ev.time.elapsed}&apos;</span>
                  <span>{ev.player.name}</span>
                  <BadgeChip tone="muted">{ev.detail}</BadgeChip>
                </li>
              ))}
              {!fixture.events?.length && <li className="text-[var(--fg-2)]">No events recorded</li>}
            </ul>
            <button type="button" className="mt-6 font-body text-sm text-[var(--accent-green)]" onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SeasonSchedule({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: fixtures = [], isLoading, error, refetch } = useSeasonSchedule();
  const [gw, setGw] = useState<'all' | number>('all');

  const gameweeks = useMemo(
    () =>
      [...new Set(fixtures.map((f) => f.matchday).filter((m): m is number => m != null))].sort(
        (a, b) => a - b
      ),
    [fixtures]
  );

  if (isLoading) return <LoadingState message="LOADING SCHEDULE" />;
  if (error) return <ErrorState message="Failed to load schedule" onRetry={() => refetch()} />;
  if (!fixtures.length) return <EmptyState title="No schedule available" description="Try again later." />;

  const filtered = gw === 'all' ? fixtures : fixtures.filter((f) => f.matchday === gw);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="gwFilter" className="font-body text-sm text-[var(--fg-2)]">
          Gameweek
        </label>
        <select
          id="gwFilter"
          value={gw}
          onChange={(e) => setGw(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded border border-[var(--hairline)] bg-[var(--bg-2)] px-3 py-2 font-body text-sm"
        >
          <option value="all">All ({fixtures.length} matches)</option>
          {gameweeks.map((n) => (
            <option key={n} value={n}>
              GW {n}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--panel-border)] bg-white shadow-[var(--card-shadow)]">
        <table className="w-full min-w-[720px] border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-[var(--panel-border)] text-left text-xs uppercase tracking-wide text-[var(--fg-2)]">
              <th className="px-4 py-3">GW</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Kickoff</th>
              <th className="px-4 py-3 text-right">Home</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3">Away</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => {
              const finished = FINISHED_STATUSES.includes(f.fixture.status.short);
              const live = LIVE_STATUSES.includes(f.fixture.status.short);
              return (
                <tr
                  key={f.fixture.id}
                  onClick={() => onSelect(f.fixture.id)}
                  className={`cursor-pointer border-b border-[var(--panel-border)]/60 transition-colors last:border-b-0 hover:bg-[var(--bg-0)] ${
                    live ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-stat text-[var(--fg-2)]">{f.matchday ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">{kickoffDay(f.fixture.date)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">{kickoffTime(f.fixture.date)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <TeamCell team={f.teams.home} align="right" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-center font-stat font-semibold">
                    {finished || live ? `${f.goals.home ?? 0} – ${f.goals.away ?? 0}` : 'vs'}
                  </td>
                  <td className="px-4 py-2.5">
                    <TeamCell team={f.teams.away} />
                  </td>
                  <td className="px-4 py-2.5">{statusChip(f)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FixturesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'schedule' ? 'schedule' : 'day';

  // null = no date chosen yet; the backend then returns the nearest matchday
  // so the page never opens on an empty day (off-season, midweek gaps).
  const [date, setDate] = useState<string | null>(
    import.meta.env.VITE_DEFAULT_FIXTURE_DATE ?? null
  );
  const [selectedFixture, setSelectedFixture] = useState<number | null>(null);
  const { data, isLoading, error, refetch } = useFixtures(view === 'day' ? (date ?? undefined) : undefined);

  const shownDate = date ?? data?.date ?? DEFAULT_FIXTURE_DATE;

  const shiftDate = (days: number) => {
    const d = new Date(shownDate);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  const grouped = (data?.fixtures ?? []).reduce<Record<string, Fixture[]>>((acc, f) => {
    const key = f.league.name;
    acc[key] = acc[key] ?? [];
    acc[key].push(f);
    return acc;
  }, {});

  return (
    <MotionPage className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-body text-3xl font-bold">Fixtures</h1>
        <div className="flex rounded-lg border border-[var(--panel-border)] bg-white p-1">
          {(
            [
              { key: 'day', label: 'By Date' },
              { key: 'schedule', label: 'Season Schedule' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSearchParams(tab.key === 'day' ? {} : { view: tab.key })}
              className={`rounded-md px-4 py-1.5 font-body text-sm font-medium transition-colors ${
                view === tab.key
                  ? 'bg-[var(--accent-green)] text-white'
                  : 'text-[var(--fg-1)] hover:text-[var(--fg-0)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {view === 'schedule' ? (
        <SeasonSchedule onSelect={setSelectedFixture} />
      ) : (
        <>
          <div className="flex items-center justify-center gap-4">
            <button type="button" onClick={() => shiftDate(-1)} className="font-stat text-xl text-[var(--fg-1)]">
              ←
            </button>
            <input
              type="date"
              value={shownDate}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border border-[var(--hairline)] bg-[var(--bg-2)] px-3 py-2 font-body text-sm"
            />
            <button type="button" onClick={() => shiftDate(1)} className="font-stat text-xl text-[var(--fg-1)]">
              →
            </button>
          </div>

          {isLoading ? (
            <LoadingState message="LOADING FIXTURES" />
          ) : error ? (
            <ErrorState message="Failed to load fixtures" onRetry={() => refetch()} />
          ) : !Object.keys(grouped).length ? (
            <EmptyState title="No fixtures" description="No matches scheduled for this date." />
          ) : (
            Object.entries(grouped).map(([league, fixtures]) => (
              <Panel key={league} title={league}>
                <ul className="space-y-2">
                  {fixtures.map((f) => {
                    const live = LIVE_STATUSES.includes(f.fixture.status.short);
                    const finished = FINISHED_STATUSES.includes(f.fixture.status.short);
                    return (
                      <li
                        key={f.fixture.id}
                        onClick={() => setSelectedFixture(f.fixture.id)}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:border-[var(--hairline)] ${
                          live
                            ? 'border-[var(--accent-green)]/50 shadow-[var(--glow-green)]'
                            : finished
                              ? 'border-[var(--panel-border)] opacity-70'
                              : 'border-[var(--panel-border)]'
                        }`}
                      >
                        <div className="font-body text-sm">
                          <span>{f.teams.home.name}</span>
                          <span className="mx-2 text-[var(--fg-2)]">vs</span>
                          <span>{f.teams.away.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-stat text-lg">
                            {f.goals.home ?? '-'} – {f.goals.away ?? '-'}
                          </span>
                          {live && <BadgeChip tone="green">LIVE</BadgeChip>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ))
          )}
        </>
      )}

      {selectedFixture && <FixtureModal fixtureId={selectedFixture} onClose={() => setSelectedFixture(null)} />}
    </MotionPage>
  );
}
