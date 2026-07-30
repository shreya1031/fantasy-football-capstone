export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export type Formation = '4-4-2' | '4-3-3' | '3-5-2';

export interface PlayerSlot {
  apiPlayerId: number;
  name: string;
  position: Position;
  teamId?: number;
  teamName?: string;
  photo?: string;
  isCaptain: boolean;
}

export interface Team {
  _id: string;
  name: string;
  formation: Formation;
  players: PlayerSlot[];
  owner: string;
  leagueRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface League {
  _id: string;
  name: string;
  code: string;
  owner: string;
  season: number;
  createdAt: string;
}

export interface Membership {
  _id: string;
  league: League;
  user: User;
  teamRef?: Team;
  joinedAt: string;
}

export interface Player {
  id: number;
  name: string;
  firstname?: string;
  lastname?: string;
  age?: number;
  nationality?: string;
  photo?: string;
  position: Position;
  team?: {
    id: number;
    name: string;
    logo?: string;
  };
  statistics?: unknown[];
}

export interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
  };
  league: { id: number; name: string; logo?: string };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
  goals: { home: number | null; away: number | null };
  matchday?: number;
  events?: Array<{
    time: { elapsed: number };
    team: { id: number; name: string };
    player: { id: number; name: string };
    type: string;
    detail: string;
  }>;
}

export interface StandingRow {
  rank: number;
  team: { id: number; name: string; logo?: string };
  points: number;
  goalsDiff: number;
  all: { played: number; win: number; draw: number; lose: number };
  form?: string;
}

export interface GameweekScore {
  points: number;
  breakdown: Array<{
    apiPlayerId?: number;
    playerName?: string;
    event: string;
    points: number;
    fixtureId?: number;
  }>;
  isFinal: boolean;
}

export interface LeaderboardRow {
  rank: number;
  membershipId: string;
  user: User;
  team: Team;
  points: number;
  gameweek: number;
  season: number;
}
