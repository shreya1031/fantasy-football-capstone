import type { Formation, Position, PlayerSlot } from '../../lib/types';

export const FORMATION_SLOTS: Record<Formation, Array<{ position: Position; x: number; y: number }>> = {
  '4-4-2': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'DEF', x: 15, y: 68 },
    { position: 'DEF', x: 38, y: 68 },
    { position: 'DEF', x: 62, y: 68 },
    { position: 'DEF', x: 85, y: 68 },
    { position: 'MID', x: 15, y: 42 },
    { position: 'MID', x: 38, y: 42 },
    { position: 'MID', x: 62, y: 42 },
    { position: 'MID', x: 85, y: 42 },
    { position: 'FWD', x: 35, y: 18 },
    { position: 'FWD', x: 65, y: 18 },
  ],
  '4-3-3': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'DEF', x: 15, y: 68 },
    { position: 'DEF', x: 38, y: 68 },
    { position: 'DEF', x: 62, y: 68 },
    { position: 'DEF', x: 85, y: 68 },
    { position: 'MID', x: 25, y: 42 },
    { position: 'MID', x: 50, y: 42 },
    { position: 'MID', x: 75, y: 42 },
    { position: 'FWD', x: 20, y: 18 },
    { position: 'FWD', x: 50, y: 12 },
    { position: 'FWD', x: 80, y: 18 },
  ],
  '3-5-2': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'DEF', x: 25, y: 68 },
    { position: 'DEF', x: 50, y: 68 },
    { position: 'DEF', x: 75, y: 68 },
    { position: 'MID', x: 10, y: 42 },
    { position: 'MID', x: 30, y: 42 },
    { position: 'MID', x: 50, y: 42 },
    { position: 'MID', x: 70, y: 42 },
    { position: 'MID', x: 90, y: 42 },
    { position: 'FWD', x: 35, y: 18 },
    { position: 'FWD', x: 65, y: 18 },
  ],
};

export function emptySlots(formation: Formation): (PlayerSlot | null)[] {
  return FORMATION_SLOTS[formation].map(() => null);
}

export function validateTeam(players: (PlayerSlot | null)[]) {
  const filled = players.filter(Boolean) as PlayerSlot[];
  if (filled.length !== 11) return 'Select 11 players';
  const ids = filled.map((p) => p.apiPlayerId);
  if (new Set(ids).size !== ids.length) return 'Duplicate players not allowed';
  const captains = filled.filter((p) => p.isCaptain);
  if (captains.length !== 1) return 'Select exactly one captain';
  return null;
}
