import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  Team,
  League,
  Membership,
  Player,
  Fixture,
  StandingRow,
  GameweekScore,
  LeaderboardRow,
  AdminUser,
  AdminLeague,
} from './types';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const paidDataQueryOptions = {
  retry: false,
};

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get<{ teams: Team[] }>('/teams');
      return data.teams;
    },
  });
}

export function useTeam(id?: string) {
  return useQuery({
    queryKey: ['teams', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<{ team: Team }>(`/teams/${id}`);
      return data.team;
    },
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; formation: Team['formation']; players: Team['players'] }) => {
      const { data } = await api.post<{ team: Team }>('/teams', payload);
      return data.team;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name: string; formation: Team['formation']; players: Team['players'] }) => {
      const { data } = await api.put<{ team: Team }>(`/teams/${id}`, payload);
      return data.team;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['teams', vars.id] });
    },
  });
}

export function useLeagues() {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: async () => {
      const { data } = await api.get<{ leagues: Membership[] }>('/leagues');
      return data.leagues;
    },
  });
}

export function useLeague(id?: string) {
  return useQuery({
    queryKey: ['leagues', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<{ league: League; members: Membership[] }>(`/leagues/${id}`);
      return data;
    },
  });
}

export function useLeaderboard(leagueId?: string, gw?: number) {
  return useQuery({
    queryKey: ['leaderboard', leagueId, gw],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data } = await api.get<{ gameweek: number; season: number; leaderboard: LeaderboardRow[] }>(
        `/leagues/${leagueId}/leaderboard`,
        { params: { gw } }
      );
      return data;
    },
  });
}

export function useCreateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; teamId?: string }) => {
      const { data } = await api.post<{ league: League }>('/leagues', payload);
      return data.league;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leagues'] }),
  });
}

export function useJoinLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { code: string; teamId?: string }) => {
      const { data } = await api.post('/leagues/join', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leagues'] }),
  });
}

export function useDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leagueId: string) => {
      await api.delete(`/leagues/${leagueId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leagues'] }),
  });
}

export function useRemoveLeagueMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leagueId, membershipId }: { leagueId: string; membershipId: string }) => {
      await api.delete(`/leagues/${leagueId}/members/${membershipId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['leagues', vars.leagueId] });
      qc.invalidateQueries({ queryKey: ['leaderboard', vars.leagueId] });
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get<{ users: AdminUser[] }>('/admin/users');
      return data.users;
    },
  });
}

export function useAdminLeagues() {
  return useQuery({
    queryKey: ['admin', 'leagues'],
    queryFn: async () => {
      const { data } = await api.get<{ leagues: AdminLeague[] }>('/admin/leagues');
      return data.leagues;
    },
  });
}

export function useAdminDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useAdminDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leagueId: string) => {
      await api.delete(`/admin/leagues/${leagueId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useAdminRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leagueId, membershipId }: { leagueId: string; membershipId: string }) => {
      await api.delete(`/admin/leagues/${leagueId}/members/${membershipId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function usePlayers(search: string, page = 1) {
  return useQuery({
    queryKey: ['players', search, page],
    staleTime: 12 * HOUR,
    ...paidDataQueryOptions,
    queryFn: async () => {
      const { data } = await api.get<{ players: Player[]; page: number; total: number }>('/players', {
        params: { search, page },
      });
      return data;
    },
  });
}

export function usePlayer(id?: string) {
  return useQuery({
    queryKey: ['players', id],
    enabled: !!id,
    staleTime: 12 * HOUR,
    ...paidDataQueryOptions,
    queryFn: async () => {
      const { data } = await api.get<{ player: Player }>(`/players/${id}`);
      return data.player;
    },
  });
}

export function useFixtures(date?: string) {
  return useQuery({
    queryKey: ['fixtures', date],
    staleTime: HOUR,
    ...paidDataQueryOptions,
    queryFn: async () => {
      const { data } = await api.get<{ date: string; fixtures: Fixture[] }>('/fixtures', {
        params: { date },
      });
      return data;
    },
  });
}

export function useUpcomingFixtures(limit = 10) {
  return useQuery({
    queryKey: ['fixtures', 'upcoming', limit],
    staleTime: HOUR,
    ...paidDataQueryOptions,
    queryFn: async () => {
      const { data } = await api.get<{ fixtures: Fixture[] }>('/fixtures/upcoming', {
        params: { limit },
      });
      return data.fixtures;
    },
  });
}

export function useSeasonSchedule() {
  return useQuery({
    queryKey: ['fixtures', 'schedule'],
    staleTime: 6 * HOUR,
    ...paidDataQueryOptions,
    queryFn: async () => {
      const { data } = await api.get<{ fixtures: Fixture[] }>('/fixtures/schedule');
      return data.fixtures;
    },
  });
}

export function useFixture(id?: string) {
  return useQuery({
    queryKey: ['fixtures', id],
    enabled: !!id,
    staleTime: 30 * SECOND,
    ...paidDataQueryOptions,
    queryFn: async () => {
      const { data } = await api.get<{ fixture: Fixture }>(`/fixtures/${id}`);
      return data.fixture;
    },
  });
}

export function useStandings() {
  return useQuery({
    queryKey: ['standings'],
    staleTime: 15 * MINUTE,
    ...paidDataQueryOptions,
    queryFn: async () => {
      const { data } = await api.get<{ standings: StandingRow[] }>('/standings');
      return data.standings;
    },
  });
}

export function useTeamScore(teamId?: string, gw?: number) {
  return useQuery({
    queryKey: ['score', teamId, gw],
    enabled: !!teamId,
    queryFn: async () => {
      const { data } = await api.get<{ score: GameweekScore; gameweek: number; season: number }>(
        `/scoring/teams/${teamId}`,
        { params: { gw } }
      );
      return data;
    },
  });
}
