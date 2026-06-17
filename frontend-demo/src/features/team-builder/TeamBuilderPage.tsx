import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { MotionPage } from '../../design/primitives/Stat';
import { Panel } from '../../design/primitives/Panel';
import { Button, Input, Label } from '../../design/primitives/Button';
import { LoadingState } from '../../design/primitives/States';
import { useTeam, useCreateTeam, useUpdateTeam, usePlayers } from '../../lib/hooks';
import { Pitch } from './Pitch';
import { emptySlots, validateTeam, FORMATION_SLOTS } from './formations';
import type { Formation, Player, PlayerSlot } from '../../lib/types';
import { getErrorMessage } from '../../lib/errors';

const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2'];

export function TeamBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: existingTeam, isLoading } = useTeam(id);
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  const [teamName, setTeamName] = useState('My Squad');
  const [formation, setFormation] = useState<Formation>('4-4-2');
  const [slots, setSlots] = useState<(PlayerSlot | null)[]>(() => emptySlots('4-4-2'));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const { data: playersData, isLoading: playersLoading } = usePlayers(search);

  useEffect(() => {
    if (existingTeam) {
      setTeamName(existingTeam.name);
      setFormation(existingTeam.formation);
      const newSlots = emptySlots(existingTeam.formation);
      existingTeam.players.forEach((p, i) => {
        if (i < newSlots.length) newSlots[i] = p;
      });
      setSlots(newSlots);
    }
  }, [existingTeam]);

  const handleFormationChange = (f: Formation) => {
    setFormation(f);
    setSlots(emptySlots(f));
    setSelectedSlot(null);
  };

  const assignPlayer = (player: Player) => {
    if (selectedSlot === null) return;
    const slotMeta = FORMATION_SLOTS[formation][selectedSlot];
    if (slotMeta.position !== player.position) {
      setError(`This slot requires a ${slotMeta.position}`);
      return;
    }

    const newSlots = [...slots];
    newSlots[selectedSlot] = {
      apiPlayerId: player.id,
      name: player.name,
      position: player.position,
      teamId: player.team?.id,
      teamName: player.team?.name,
      photo: player.photo,
      isCaptain: false,
    };
    setSlots(newSlots);
    setSelectedSlot(null);
    setError('');
  };

  const toggleCaptain = (index: number) => {
    setSlots(
      slots.map((s, i) =>
        s ? { ...s, isCaptain: i === index } : s
      )
    );
  };

  const handleSave = async () => {
    const validationError = validateTeam(slots);
    if (validationError) {
      setError(validationError);
      return;
    }

    const players = slots.filter(Boolean) as PlayerSlot[];
    try {
      if (id) {
        await updateTeam.mutateAsync({ id, name: teamName, formation, players });
      } else {
        const team = await createTeam.mutateAsync({ name: teamName, formation, players });
        navigate(`/team/${team._id}`);
      }
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (id && isLoading) return <LoadingState message="LOADING TEAM" />;

  return (
    <MotionPage className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-body text-3xl font-bold">Team Builder</h1>
          <p className="font-body text-sm text-[var(--fg-2)]">Select a slot, pick a player. Right-click to set captain.</p>
        </div>
        <Button onClick={handleSave} disabled={createTeam.isPending || updateTeam.isPending}>
          {createTeam.isPending || updateTeam.isPending ? 'Saving…' : 'Save Team'}
        </Button>
      </header>

      {error && <p className="mb-4 text-sm text-[var(--accent-magenta)]">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title="Pitch">
          <div className="mb-4 flex gap-2">
            {FORMATIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleFormationChange(f)}
                className={`rounded border px-3 py-1.5 font-mono text-xs ${
                  formation === f
                    ? 'border-[var(--accent-green)] text-[var(--accent-green)]'
                    : 'border-[var(--panel-border)] text-[var(--fg-2)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Pitch
            formation={formation}
            players={slots}
            selectedSlot={selectedSlot}
            onSlotClick={setSelectedSlot}
            onToggleCaptain={toggleCaptain}
          />
          <div className="mt-4">
            <Label htmlFor="teamName">Team name</Label>
            <Input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>
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
            <LoadingState message="SEARCHING" />
          ) : (
            <ul className="max-h-[480px] space-y-2 overflow-y-auto">
              {playersData?.players.map((player) => (
                <motion.li
                  key={player.id}
                  layoutId={`player-${player.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--panel-border)] p-2 hover:border-[var(--hairline)]"
                  onClick={() => assignPlayer(player)}
                >
                  {player.photo && (
                    <img src={player.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium">{player.name}</p>
                    <p className="font-mono text-xs text-[var(--fg-2)]">
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
