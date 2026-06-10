import { create } from 'zustand';
import type { Formation, PlayerSlot } from './types';
import { emptySlots } from '../features/team-builder/formations';

interface TeamDraftState {
  name: string;
  formation: Formation;
  players: (PlayerSlot | null)[];
  existingTeamId: string | null;
  setName: (name: string) => void;
  setFormation: (formation: Formation) => void;
  setPlayers: (players: (PlayerSlot | null)[]) => void;
  setExistingTeamId: (id: string | null) => void;
  loadFromTeam: (team: { _id: string; name: string; formation: Formation; players: PlayerSlot[] }) => void;
  reset: () => void;
}

export const useTeamDraftStore = create<TeamDraftState>((set) => ({
  name: 'My Squad',
  formation: '4-4-2',
  players: emptySlots('4-4-2'),
  existingTeamId: null,

  setName: (name) => set({ name }),
  setFormation: (formation) =>
    set({ formation, players: emptySlots(formation) }),
  setPlayers: (players) => set({ players }),
  setExistingTeamId: (id) => set({ existingTeamId: id }),

  loadFromTeam: (team) => {
    const slots = emptySlots(team.formation);
    team.players.forEach((p, i) => {
      if (i < slots.length) slots[i] = p;
    });
    set({
      name: team.name,
      formation: team.formation,
      players: slots,
      existingTeamId: team._id,
    });
  },

  reset: () =>
    set({
      name: 'My Squad',
      formation: '4-4-2',
      players: emptySlots('4-4-2'),
      existingTeamId: null,
    }),
}));
