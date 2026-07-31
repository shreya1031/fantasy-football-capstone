import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MotionPage, StatInline } from '../../design/primitives/Stat';
import { Panel } from '../../design/primitives/Panel';
import { Button } from '../../design/primitives/Button';
import { DataTable } from '../../design/primitives/DataTable';
import { BadgeChip, RankChip } from '../../design/primitives/BadgeChip';
import { LoadingState, ErrorState } from '../../design/primitives/States';
import { useLeague, useLeaderboard, useDeleteLeague, useRemoveLeagueMember } from '../../lib/hooks';
import { useAuthStore } from '../../lib/authStore';
import { getErrorMessage } from '../../lib/errors';
import type { LeaderboardRow, Team } from '../../lib/types';

function LineupPeek({ team, onClose }: { team: Team; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-[var(--panel-border)] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold">{team.name}</h3>
        <p className="font-body text-sm text-[var(--fg-2)]">{team.formation}</p>
        <ul className="mt-4 space-y-2">
          {team.players.map((p) => (
            <li key={p.apiPlayerId} className="flex items-center justify-between font-body text-sm">
              <span>{p.name}</span>
              <BadgeChip tone={p.isCaptain ? 'amber' : 'muted'}>{p.position}</BadgeChip>
            </li>
          ))}
        </ul>
        <button type="button" className="mt-4 text-sm font-semibold text-[var(--accent-green)]" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export function LeagueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [gameweek, setGameweek] = useState(1);
  const [peekTeam, setPeekTeam] = useState<Team | null>(null);
  const [actionError, setActionError] = useState('');

  const { data: leagueData, isLoading: leagueLoading } = useLeague(id);
  const { data: leaderboardData, isLoading: lbLoading, error, refetch } = useLeaderboard(id, gameweek);
  const deleteLeague = useDeleteLeague();
  const removeMember = useRemoveLeagueMember();

  if (leagueLoading) return <LoadingState message="Loading league" />;

  const currentUserId = user?._id ?? user?.id;
  const leagueOwner = leagueData?.league.owner as unknown;
  const ownerId =
    typeof leagueOwner === 'string'
      ? leagueOwner
      : ((leagueOwner as { _id?: string } | undefined)?._id ?? '');
  const canManage = user?.role === 'admin' || (!!currentUserId && ownerId === currentUserId);

  const handleDeleteLeague = async () => {
    if (!id || !window.confirm('Delete this league? All members will be removed.')) return;
    setActionError('');
    try {
      await deleteLeague.mutateAsync(id);
      navigate('/leagues');
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleKick = async (row: LeaderboardRow) => {
    if (!id || !window.confirm(`Remove ${row.user.displayName} from this league?`)) return;
    setActionError('');
    try {
      await removeMember.mutateAsync({ leagueId: id, membershipId: row.membershipId });
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const columns = [
    {
      key: 'rank',
      header: 'Rank',
      className: 'w-20',
      render: (row: LeaderboardRow) => <RankChip rank={row.rank} />,
    },
    {
      key: 'user',
      header: 'Manager',
      render: (row: LeaderboardRow) => row.user.displayName,
    },
    {
      key: 'team',
      header: 'Team',
      render: (row: LeaderboardRow) => row.team?.name ?? '—',
    },
    {
      key: 'points',
      header: 'Points',
      className: 'font-stat text-lg font-semibold text-[var(--accent-green)]',
      render: (row: LeaderboardRow) => row.points,
    },
    {
      key: 'change',
      header: 'Δ',
      render: (row: LeaderboardRow) => (
        <BadgeChip tone={row.rank <= 3 ? 'green' : 'muted'}>
          {row.rank <= 3 ? '▲' : '—'}
        </BadgeChip>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'manage',
            header: '',
            className: 'text-right',
            render: (row: LeaderboardRow) => (
              <button
                type="button"
                className="rounded px-2 py-1 font-body text-xs text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleKick(row);
                }}
                disabled={removeMember.isPending}
              >
                Kick
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <MotionPage className="mx-auto max-w-5xl space-y-6">
      <Link to="/leagues" className="font-body text-sm font-semibold text-[var(--accent-green)] hover:underline">
        ← All leagues
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{leagueData?.league.name}</h1>
          <p className="mt-1 font-stat text-lg font-semibold text-[var(--accent-green)]">{leagueData?.league.code}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--fg-2)]">Gameweek</label>
          <input
            type="number"
            min={1}
            value={gameweek}
            onChange={(e) => setGameweek(Number(e.target.value))}
            className="w-16 rounded-lg border border-[var(--panel-border)] bg-white px-2 py-1 font-stat text-lg font-semibold"
          />
          {canManage && (
            <Button
              variant="ghost"
              className="text-xs text-red-600 hover:bg-red-50"
              onClick={handleDeleteLeague}
              disabled={deleteLeague.isPending}
            >
              Delete League
            </Button>
          )}
        </div>
      </header>

      {actionError && <p className="text-sm text-[var(--accent-orange)]">{actionError}</p>}

      <div className="flex gap-6 rounded-xl border border-[var(--panel-border)] bg-white px-5 py-4 shadow-[var(--card-shadow)]">
        <StatInline label="GW" value={gameweek} />
        <StatInline label="Members" value={leagueData?.members.length ?? 0} />
      </div>

      <Panel title="Leaderboard">
        {lbLoading ? (
          <LoadingState message="Loading leaderboard" />
        ) : error ? (
          <ErrorState message="Failed to load leaderboard" onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={leaderboardData?.leaderboard ?? []}
            keyField={(r) => r.membershipId}
            onRowClick={(row) => row.team && setPeekTeam(row.team)}
            emptyMessage="No scores yet for this gameweek"
          />
        )}
      </Panel>

      {peekTeam && <LineupPeek team={peekTeam} onClose={() => setPeekTeam(null)} />}
    </MotionPage>
  );
}
