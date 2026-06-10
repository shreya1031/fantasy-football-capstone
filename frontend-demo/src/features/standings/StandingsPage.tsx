import { MotionPage } from '../../design/primitives/Stat';
import { Panel } from '../../design/primitives/Panel';
import { DataTable } from '../../design/primitives/DataTable';
import { FormChip } from '../../design/primitives/BadgeChip';
import { LoadingState, ErrorState } from '../../design/primitives/States';
import { useStandings } from '../../lib/hooks';
import type { StandingRow } from '../../lib/types';

export function StandingsPage() {
  const { data: standings, isLoading, error, refetch } = useStandings();

  const columns = [
    {
      key: 'rank',
      header: '#',
      className: 'w-12 font-stat',
      render: (row: StandingRow) => row.rank,
    },
    {
      key: 'team',
      header: 'Team',
      render: (row: StandingRow) => (
        <div className="flex items-center gap-2">
          {row.team.logo && <img src={row.team.logo} alt="" className="h-6 w-6" />}
          <span>{row.team.name}</span>
        </div>
      ),
    },
    {
      key: 'played',
      header: 'P',
      className: 'text-center',
      render: (row: StandingRow) => row.all.played,
    },
    {
      key: 'won',
      header: 'W',
      className: 'text-center',
      render: (row: StandingRow) => row.all.win,
    },
    {
      key: 'draw',
      header: 'D',
      className: 'text-center',
      render: (row: StandingRow) => row.all.draw,
    },
    {
      key: 'lost',
      header: 'L',
      className: 'text-center',
      render: (row: StandingRow) => row.all.lose,
    },
    {
      key: 'gd',
      header: 'GD',
      className: 'text-center font-stat',
      render: (row: StandingRow) => (row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff),
    },
    {
      key: 'pts',
      header: 'Pts',
      className: 'text-center font-stat text-[var(--accent-green)]',
      render: (row: StandingRow) => row.points,
    },
    {
      key: 'form',
      header: 'Form',
      render: (row: StandingRow) => (
        <div className="flex gap-1">
          {(row.form ?? '').split('').slice(-5).map((r, i) => (
            <FormChip key={i} result={r as 'W' | 'D' | 'L'} />
          ))}
        </div>
      ),
    },
  ];

  return (
    <MotionPage className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-body text-3xl font-bold">Standings</h1>
        <p className="font-body text-sm text-[var(--fg-2)]">Premier League table</p>
      </header>

      <Panel title="League Table">
        {isLoading ? (
          <LoadingState message="LOADING STANDINGS" />
        ) : error ? (
          <ErrorState message="Failed to load standings" onRetry={() => refetch()} />
        ) : (
          <DataTable columns={columns} rows={standings ?? []} keyField={(r) => String(r.team.id)} />
        )}
      </Panel>
    </MotionPage>
  );
}
