import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MotionPage } from '../../design/primitives/Stat';
import { Panel } from '../../design/primitives/Panel';
import { Button, Input, Label } from '../../design/primitives/Button';
import { LoadingState, ErrorState, EmptyState } from '../../design/primitives/States';
import { useLeagues, useCreateLeague, useJoinLeague, useTeams } from '../../lib/hooks';
import { getErrorMessage } from '../../lib/errors';

export function LeaguesPage() {
  const { data: leagues, isLoading, error, refetch } = useLeagues();
  const { data: teams } = useTeams();
  const createLeague = useCreateLeague();
  const joinLeague = useJoinLeague();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [formError, setFormError] = useState('');

  const handleCreate = async () => {
    setFormError('');
    try {
      const league = await createLeague.mutateAsync({ name: leagueName, teamId: teams?.[0]?._id });
      setCreatedCode(league.code);
      setLeagueName('');
      setShowCreate(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const handleJoin = async () => {
    setFormError('');
    try {
      await joinLeague.mutateAsync({
        code: joinCode.toUpperCase(),
        teamId: teams?.[0]?._id,
      });
      setJoinCode('');
      setShowJoin(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode);
  };

  if (isLoading) return <LoadingState message="Loading leagues" />;
  if (error) return <ErrorState message="Failed to load leagues" onRetry={() => refetch()} />;

  return (
    <MotionPage className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Leagues</h1>
          <p className="font-body text-sm text-[var(--fg-2)]">Create or join private leagues with friends</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowJoin(true)}>
            Join League
          </Button>
          <Button onClick={() => setShowCreate(true)}>Create League</Button>
        </div>
      </header>

      {createdCode && (
        <div className="rounded-xl border border-[var(--accent-green)]/30 bg-white p-6 text-center shadow-[var(--card-shadow)]">
          <p className="font-body text-sm text-[var(--fg-1)]">Share this code with friends</p>
          <p className="mt-2 font-stat text-4xl font-bold tracking-widest text-[var(--accent-green)]">{createdCode}</p>
          <Button variant="ghost" className="mt-4" onClick={copyCode}>
            Copy Code
          </Button>
        </div>
      )}

      {showCreate && (
        <Panel title="Create League">
          {formError && <p className="mb-3 text-sm text-[var(--accent-orange)]">{formError}</p>}
          <Label htmlFor="leagueName">League name</Label>
          <Input id="leagueName" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} className="mb-4" />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={createLeague.isPending}>
              Create
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </Panel>
      )}

      {showJoin && (
        <Panel title="Join League">
          {formError && <p className="mb-3 text-sm text-[var(--accent-orange)]">{formError}</p>}
          <Label htmlFor="joinCode">6-character code</Label>
          <Input
            id="joinCode"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="mb-4 font-stat uppercase tracking-widest"
          />
          <div className="flex gap-2">
            <Button onClick={handleJoin} disabled={joinLeague.isPending}>
              Join
            </Button>
            <Button variant="ghost" onClick={() => setShowJoin(false)}>
              Cancel
            </Button>
          </div>
        </Panel>
      )}

      {leagues?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {leagues.map((m) => (
            <Link
              key={m._id}
              to={`/leagues/${m.league._id}`}
              className="rounded-xl border border-[var(--panel-border)] bg-white p-5 shadow-[var(--card-shadow)] transition-shadow hover:shadow-[var(--glow-green)]"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-semibold">{m.league.name}</h3>
                <span aria-hidden>🏆</span>
              </div>
              <p className="mt-1 font-stat text-sm font-semibold text-[var(--accent-green)]">{m.league.code}</p>
              <p className="mt-2 font-body text-xs text-[var(--fg-2)]">Season {m.league.season}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No leagues yet" description="Create a league or join with a friend's code." />
      )}
    </MotionPage>
  );
}
