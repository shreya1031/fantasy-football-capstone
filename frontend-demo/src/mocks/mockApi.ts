import type { Fixture, GameweekScore, League, Membership, Player, Team } from '../lib/types';
import {
  buildFixtures,
  buildMemberships,
  CURRENT_GAMEWEEK,
  SAMPLE_LEAGUE_CODE,
  SEED_LEAGUES,
  SEED_PLAYERS,
  SEED_SCORES,
  SEED_STANDINGS,
  SEED_TEAMS,
  SEED_USERS,
} from './seed';
import { delay, getCurrentUserId } from './mockAuth';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const store = {
  teams: clone(SEED_TEAMS) as Team[],
  leagues: clone(SEED_LEAGUES) as League[],
  memberships: clone(buildMemberships()) as Membership[],
  scores: clone(SEED_SCORES) as Record<string, GameweekScore>,
};

function scoreKey(teamId: string, gw: number) {
  return `${teamId}:${gw}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function ensureUserData(userId: string, displayName: string) {
  const hasTeam = store.teams.some((t) => t.owner === userId);
  if (!hasTeam) {
    const template = store.teams.find((t) => t._id === 'team-1');
    if (template) {
      const newTeam: Team = {
        ...clone(template),
        _id: `team-${crypto.randomUUID().slice(0, 8)}`,
        owner: userId,
        name: `${displayName}'s XI`,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      store.teams.push(newTeam);
      store.scores[scoreKey(newTeam._id, CURRENT_GAMEWEEK)] = clone(SEED_SCORES['team-1:1']);
    }
  }

  const hasLeague = store.memberships.some((m) => m.user.id === userId);
  if (!hasLeague) {
    const league = store.leagues[0];
    const team = store.teams.find((t) => t.owner === userId);
    store.memberships.push({
      _id: `mem-${crypto.randomUUID().slice(0, 8)}`,
      league,
      user: { id: userId, email: '', displayName },
      teamRef: team,
      joinedAt: new Date().toISOString(),
    });
  }
}

export async function getTeams(): Promise<Team[]> {
  await delay();
  const userId = getCurrentUserId();
  return store.teams.filter((t) => t.owner === userId);
}

export async function getTeam(id: string): Promise<Team> {
  await delay();
  const team = store.teams.find((t) => t._id === id);
  if (!team) throw new Error('Team not found');
  return clone(team);
}

export async function createTeam(payload: {
  name: string;
  formation: Team['formation'];
  players: Team['players'];
}): Promise<Team> {
  await delay(350);
  const userId = getCurrentUserId();
  const team: Team = {
    _id: `team-${crypto.randomUUID().slice(0, 8)}`,
    name: payload.name,
    formation: payload.formation,
    players: payload.players,
    owner: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.teams.push(team);
  store.scores[scoreKey(team._id, CURRENT_GAMEWEEK)] = { points: 0, isFinal: false, breakdown: [] };
  return clone(team);
}

export async function updateTeam(
  id: string,
  payload: { name: string; formation: Team['formation']; players: Team['players'] }
): Promise<Team> {
  await delay(350);
  const idx = store.teams.findIndex((t) => t._id === id);
  if (idx === -1) throw new Error('Team not found');
  const userId = getCurrentUserId();
  if (store.teams[idx].owner !== userId) throw new Error('Access denied');

  store.teams[idx] = {
    ...store.teams[idx],
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  return clone(store.teams[idx]);
}

export async function getLeagues(): Promise<Membership[]> {
  await delay();
  const userId = getCurrentUserId();
  return store.memberships
    .filter((m) => m.user.id === userId)
    .map((m) => ({
      ...m,
      league: store.leagues.find((l) => l._id === m.league._id) ?? m.league,
      teamRef: m.teamRef ? store.teams.find((t) => t._id === m.teamRef!._id) ?? m.teamRef : undefined,
    }));
}

export async function getLeague(id: string) {
  await delay();
  const league = store.leagues.find((l) => l._id === id);
  if (!league) throw new Error('League not found');

  const members = store.memberships
    .filter((m) => m.league._id === id)
    .map((m) => ({
      ...m,
      user: SEED_USERS.find((u) => u.id === m.user.id) ?? m.user,
      teamRef: m.teamRef ? store.teams.find((t) => t._id === m.teamRef!._id) : undefined,
    }));

  return { league: clone(league), members: clone(members) };
}

export async function getLeaderboard(leagueId: string, gw = CURRENT_GAMEWEEK) {
  await delay();
  const members = store.memberships.filter((m) => m.league._id === leagueId && m.teamRef);

  const rows = members.map((m) => {
    const team = store.teams.find((t) => t._id === m.teamRef!._id)!;
    const score = store.scores[scoreKey(team._id, gw)] ?? { points: 0, isFinal: false, breakdown: [] };
    return {
      membershipId: m._id,
      user: SEED_USERS.find((u) => u.id === m.user.id) ?? m.user,
      team: clone(team),
      points: score.points,
      gameweek: gw,
      season: 2024,
    };
  });

  rows.sort((a, b) => b.points - a.points);

  return {
    gameweek: gw,
    season: 2024,
    leaderboard: rows.map((row, i) => ({ ...row, rank: i + 1 })),
  };
}

export async function createLeague(name: string): Promise<League> {
  await delay(350);
  const userId = getCurrentUserId();
  const league: League = {
    _id: `league-${crypto.randomUUID().slice(0, 8)}`,
    name,
    code: generateCode(),
    owner: userId,
    season: 2024,
    createdAt: new Date().toISOString(),
  };
  store.leagues.push(league);

  const userTeam = store.teams.find((t) => t.owner === userId);
  store.memberships.push({
    _id: `mem-${crypto.randomUUID().slice(0, 8)}`,
    league,
    user: { id: userId, email: '', displayName: 'You' },
    teamRef: userTeam,
    joinedAt: new Date().toISOString(),
  });

  return clone(league);
}

export async function joinLeague(payload: { code: string; teamId?: string }) {
  await delay(350);
  const userId = getCurrentUserId();
  const league = store.leagues.find((l) => l.code === payload.code.toUpperCase());
  if (!league) throw new Error('League not found');

  const existing = store.memberships.find((m) => m.league._id === league._id && m.user.id === userId);
  if (existing) throw new Error('You are already in this league');

  const team = payload.teamId
    ? store.teams.find((t) => t._id === payload.teamId && t.owner === userId)
    : store.teams.find((t) => t.owner === userId);

  const membership: Membership = {
    _id: `mem-${crypto.randomUUID().slice(0, 8)}`,
    league,
    user: { id: userId, email: '', displayName: 'You' },
    teamRef: team,
    joinedAt: new Date().toISOString(),
  };
  store.memberships.push(membership);

  return { league: clone(league), membership: clone(membership) };
}

export async function getPlayers(search: string, page = 1) {
  await delay();
  const filtered = SEED_PLAYERS.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );
  const pageSize = 20;
  const start = (page - 1) * pageSize;
  const players = filtered.slice(start, start + pageSize);
  return { players, page, total: filtered.length };
}

export async function getPlayer(id: string): Promise<Player> {
  await delay();
  const player = SEED_PLAYERS.find((p) => p.id === Number(id));
  if (!player) throw new Error('Player not found');
  return clone(player);
}

export async function getFixtures(date?: string) {
  await delay();
  const targetDate = date ?? todayISO();
  return { date: targetDate, fixtures: buildFixtures(targetDate) };
}

export async function getFixture(id: string): Promise<Fixture> {
  await delay();
  const fixture = buildFixtures(todayISO()).find((f) => f.fixture.id === Number(id));
  if (!fixture) throw new Error('Fixture not found');
  return clone(fixture);
}

export async function getStandings() {
  await delay();
  return SEED_STANDINGS;
}

export async function getTeamScore(teamId: string, gw = CURRENT_GAMEWEEK) {
  await delay();
  const score = store.scores[scoreKey(teamId, gw)] ?? {
    points: Math.floor(Math.random() * 40) + 30,
    isFinal: false,
    breakdown: [],
  };
  return { score, gameweek: gw, season: 2024 };
}

export { SAMPLE_LEAGUE_CODE, CURRENT_GAMEWEEK };
