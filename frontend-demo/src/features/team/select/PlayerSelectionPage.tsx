import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MotionPage } from '../../../design/primitives/Stat';
import { Panel } from '../../../design/primitives/Panel';
import { Button, Input } from '../../../design/primitives/Button';
import { LoadingState } from '../../../design/primitives/States';
import { useCreateTeam, useUpdateTeam, usePlayers, useTeams } from '../../../lib/hooks';
import { useTeamDraftStore } from '../../../lib/teamDraftStore';
import { Pitch } from '../../team-builder/Pitch';
import { validateTeam, FORMATION_SLOTS } from '../../team-builder/formations';
import type { Player, PlayerSlot } from '../../../lib/types';
import { getErrorMessage } from '../../../lib/errors';
import { useDebouncedValue } from '../../../lib/useDebouncedValue';

export function PlayerSelectionPage() {
  const navigate = useNavigate();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const { data: teams } = useTeams();

  const { name, formation, players, existingTeamId, setPlayers, loadFromTeam } = useTeamDraftStore();

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const { data: playersData, isLoading: playersLoading } = usePlayers(debouncedSearch);

  useEffect(() => {
    if (!name) navigate('/team/create', { replace: true });
  }, [name, navigate]);

  useEffect(() => {
    const existing = teams?.[0];
    if (existing && !existingTeamId && players.every((p) => p === null)) {
      loadFromTeam(existing);
    }
  }, [teams, existingTeamId, players, loadFromTeam]);

  const assignPlayer = (player: Player) => {
    if (selectedSlot === null) return;
    const slotMeta = FORMATION_SLOTS[formation][selectedSlot];
    if (slotMeta.position !== player.position) {
      setError(`This slot requires a ${slotMeta.position}`);
      return;
    }

    const newSlots = [...players];
    newSlots[selectedSlot] = {
      apiPlayerId: player.id,
      name: player.name,
      position: player.position,
      teamId: player.team?.id,
      teamName: player.team?.name,
      photo: player.photo,
      isCaptain: false,
    };
    setPlayers(newSlots);
    setSelectedSlot(null);
    setError('');
  };

  const toggleCaptain = (index: number) => {
    setPlayers(
      players.map((s, i) => (s ? { ...s, isCaptain: i === index } : s))
    );
  };

  const handleSave = async () => {
    const validationError = validateTeam(players);
    if (validationError) {
      setError(validationError);
      return;
    }

    const filled = players.filter(Boolean) as PlayerSlot[];
    try {
      if (existingTeamId) {
        await updateTeam.mutateAsync({ id: existingTeamId, name, formation, players: filled });
      } else {
        await createTeam.mutateAsync({ name, formation, players: filled });
      }
      navigate('/team/my');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <MotionPage className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-body text-sm font-medium text-[var(--accent-green)]">Step 2 of 2 · {name}</p>
          <h1 className="font-display text-3xl font-bold">Player Selection</h1>
          <p className="font-body text-sm text-[var(--fg-2)]">
            Tap a slot, pick a player. Right-click a player to set captain.
          </p>
        </div>
        <Button onClick={handleSave} disabled={createTeam.isPending || updateTeam.isPending}>
          {createTeam.isPending || updateTeam.isPending ? 'Saving…' : 'Save Team'}
        </Button>
      </header>

      {error && <p className="mb-4 text-sm text-[var(--accent-orange)]">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title={`Pitch · ${formation}`}>
          <Pitch
            formation={formation}
            players={players}
            selectedSlot={selectedSlot}
            onSlotClick={setSelectedSlot}
            onToggleCaptain={toggleCaptain}
          />
        </Panel>

        <Panel title="Player Search">
          <Input
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />
          {selectedSlot === null && (
            <p className="mb-3 font-body text-xs text-[var(--fg-2)]">Tap a pitch slot first</p>
          )}
          {playersLoading ? (
            <LoadingState message="Searching players" />
          ) : (
            <ul className="max-h-[480px] space-y-2 overflow-y-auto">
              {playersData?.players.map((player) => (
                <motion.li
                  key={player.id}
                  layoutId={`player-${player.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--panel-border)] bg-white p-2 transition-shadow hover:border-[var(--accent-green)] hover:shadow-[var(--glow-green)]"
                  onClick={() => assignPlayer(player)}
                >
                  {player.photo && (
                    <img src={player.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium">{player.name}</p>
                    <p className="text-xs text-[var(--fg-2)]">
                      {player.position} · {player.team?.name}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </MotionPage>
  );
}
