import { Link, useParams } from 'react-router-dom';
import { MotionPage } from '../../design/primitives/Stat';
import { Panel } from '../../design/primitives/Panel';
import { LoadingState, ErrorState } from '../../design/primitives/States';
import { usePlayer } from '../../lib/hooks';

export function PlayerDetailPage() {
  const { id } = useParams();
  const { data: player, isLoading, error, refetch } = usePlayer(id);

  if (isLoading) return <LoadingState message="LOADING PLAYER" />;
  if (error || !player) return <ErrorState message="Player not found" onRetry={() => refetch()} />;

  return (
    <MotionPage className="mx-auto max-w-3xl space-y-6">
      <Link to="/team" className="font-body text-sm text-[var(--accent-green)] hover:underline">
        ← Back to team
      </Link>
      <Panel>
        <div className="flex items-start gap-6">
          {player.photo && (
            <img src={player.photo} alt="" className="h-24 w-24 rounded-full border border-[var(--hairline)] object-cover" />
          )}
          <div>
            <h1 className="font-body text-3xl font-bold">{player.name}</h1>
            <p className="mt-1 font-body text-[var(--fg-2)]">
              {player.position} · {player.team?.name} · {player.nationality}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-6">
              <div>
                <p className="font-body text-xs uppercase text-[var(--fg-2)]">Age</p>
                <p className="font-stat text-3xl text-[var(--accent-green)]">{player.age ?? '—'}</p>
              </div>
              <div>
                <p className="font-body text-xs uppercase text-[var(--fg-2)]">Position</p>
                <p className="font-stat text-3xl text-[var(--accent-green)]">{player.position}</p>
              </div>
              <div>
                <p className="font-body text-xs uppercase text-[var(--fg-2)]">Team</p>
                <p className="font-stat text-3xl text-[var(--accent-green)]">
                  {player.team?.name?.slice(0, 3).toUpperCase() ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </MotionPage>
  );
}
