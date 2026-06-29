import { useState } from 'react';
import { MotionPage } from '../../design/primitives/Stat';
import { Panel } from '../../design/primitives/Panel';
import { BadgeChip } from '../../design/primitives/BadgeChip';
import { LoadingState, ErrorState, EmptyState } from '../../design/primitives/States';
import { useFixtures, useFixture } from '../../lib/hooks';
import { DEFAULT_FIXTURE_DATE } from '../../lib/config';
import type { Fixture } from '../../lib/types';

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

export function FixturesPage() {
  const [date, setDate] = useState(DEFAULT_FIXTURE_DATE);
  const [selectedFixture, setSelectedFixture] = useState<number | null>(null);
  const { data, isLoading, error, refetch } = useFixtures(date);

  const shiftDate = (days: number) => {
    const d = new Date(date);
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
    <MotionPage className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-body text-3xl font-bold">Fixtures</h1>
      </header>

      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={() => shiftDate(-1)} className="font-stat text-xl text-[var(--fg-1)]">
          ←
        </button>
        <input
          type="date"
          value={date}
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
                const live = ['1H', '2H', 'HT', 'LIVE'].includes(f.fixture.status.short);
                const finished = ['FT', 'AET', 'PEN'].includes(f.fixture.status.short);
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

      {selectedFixture && <FixtureModal fixtureId={selectedFixture} onClose={() => setSelectedFixture(null)} />}
    </MotionPage>
  );
}
