import { Link } from 'react-router-dom';
import { MotionPage, Stat } from '../../../design/primitives/Stat';
import { Panel } from '../../../design/primitives/Panel';
import { Button } from '../../../design/primitives/Button';
import { BadgeChip } from '../../../design/primitives/BadgeChip';
import { LoadingState, EmptyState } from '../../../design/primitives/States';
import { useTeams, useTeamScore } from '../../../lib/hooks';
import { useTeamDraftStore } from '../../../lib/teamDraftStore';
import { Pitch } from '../../team-builder/Pitch';
import { emptySlots } from '../../team-builder/formations';
import { useEffect } from 'react';

export function MyTeamPage() {
  const { data: teams, isLoading } = useTeams();
  const loadFromTeam = useTeamDraftStore((s) => s.loadFromTeam);
  const team = teams?.[0];
  const { data: scoreData } = useTeamScore(team?._id);

  useEffect(() => {
    if (team) loadFromTeam(team);
  }, [team, loadFromTeam]);

  if (isLoading) return <LoadingState message="Loading team" />;

  if (!team) {
    return (
      <MotionPage className="mx-auto max-w-2xl">
        <EmptyState
          title="No team yet"
          description="Create your fantasy squad to start competing."
          action={
            <Link to="/team/create">
              <Button>Create Fantasy Team</Button>
            </Link>
          }
        />
      </MotionPage>
    );
  }

  const slots = emptySlots(team.formation);
  team.players.forEach((p, i) => {
    if (i < slots.length) slots[i] = p;
  });

  const captain = team.players.find((p) => p.isCaptain);

  return (
    <MotionPage className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{team.name}</h1>
          <p className="mt-1 font-body text-sm text-[var(--fg-2)]">
            {team.formation}
            {captain && (
              <>
                {' '}
                · Captain:{' '}
                <span className="font-semibold text-[var(--accent-gold)]">{captain.name}</span>
              </>
            )}
          </p>
        </div>
        <Link to="/team/select">
          <Button variant="ghost">Edit Team</Button>
        </Link>
      </header>

      <div className="flex flex-wrap gap-8 rounded-xl border border-[var(--panel-border)] bg-white p-6 shadow-[var(--card-shadow)]">
        <Stat label="GW Points" value={scoreData?.score.points ?? 0} />
        <Stat label="Gameweek" value={scoreData?.gameweek ?? 12} />
      </div>

      <Panel title="Lineup">
        <Pitch
          formation={team.formation}
          players={slots}
          selectedSlot={null}
          onSlotClick={() => {}}
          onToggleCaptain={() => {}}
          readOnly
        />
        <div className="mt-6 flex flex-wrap gap-2">
          {team.players.map((p) => (
            <BadgeChip key={p.apiPlayerId} tone={p.isCaptain ? 'amber' : 'muted'}>
              {p.isCaptain ? 'C · ' : ''}
              {p.name} ({p.position})
            </BadgeChip>
          ))}
        </div>
      </Panel>
    </MotionPage>
  );
}
