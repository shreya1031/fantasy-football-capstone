import type {
  Fixture,
  GameweekScore,
  League,
  Membership,
  Player,
  PlayerSlot,
  StandingRow,
  Team,
  User,
} from '../lib/types';

export const SAMPLE_LEAGUE_CODE = 'WEEK42';

const clubs = [
  { id: 1, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
  { id: 2, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
  { id: 3, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
  { id: 4, name: 'Man City', logo: 'https://media.api-sports.io/football/teams/50.png' },
  { id: 5, name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
  { id: 6, name: 'Man United', logo: 'https://media.api-sports.io/football/teams/33.png' },
];

function avatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0E1311&color=2BFF9C&size=128`;
}

function player(
  id: number,
  name: string,
  position: Player['position'],
  clubIndex: number,
  age: number,
  nationality: string
): Player {
  const club = clubs[clubIndex];
  return {
    id,
    name,
    firstname: name.split(' ')[0],
    lastname: name.split(' ').slice(1).join(' '),
    age,
    nationality,
    photo: avatar(name),
    position,
    team: { id: club.id, name: club.name, logo: club.logo },
  };
}

export const SEED_PLAYERS: Player[] = [
  player(1, 'David Raya', 'GK', 0, 28, 'Spain'),
  player(2, 'William Saliba', 'DEF', 0, 23, 'France'),
  player(3, 'Gabriel Magalhaes', 'DEF', 0, 26, 'Brazil'),
  player(4, 'Ben White', 'DEF', 0, 26, 'England'),
  player(5, 'Oleksandr Zinchenko', 'DEF', 0, 27, 'Ukraine'),
  player(6, 'Declan Rice', 'MID', 0, 25, 'England'),
  player(7, 'Martin Odegaard', 'MID', 0, 25, 'Norway'),
  player(8, 'Bukayo Saka', 'MID', 0, 22, 'England'),
  player(9, 'Gabriel Jesus', 'FWD', 0, 27, 'Brazil'),
  player(10, 'Kai Havertz', 'FWD', 0, 25, 'Germany'),
  player(11, 'Robert Sanchez', 'GK', 1, 26, 'Spain'),
  player(12, 'Reece James', 'DEF', 1, 24, 'England'),
  player(13, 'Levi Colwill', 'DEF', 1, 21, 'England'),
  player(14, 'Malo Gusto', 'DEF', 1, 21, 'France'),
  player(15, 'Moises Caicedo', 'MID', 1, 22, 'Ecuador'),
  player(16, 'Enzo Fernandez', 'MID', 1, 23, 'Argentina'),
  player(17, 'Cole Palmer', 'MID', 1, 22, 'England'),
  player(18, 'Nicolas Jackson', 'FWD', 1, 23, 'Senegal'),
  player(19, 'Alisson Becker', 'GK', 2, 31, 'Brazil'),
  player(20, 'Virgil van Dijk', 'DEF', 2, 32, 'Netherlands'),
  player(21, 'Trent Alexander-Arnold', 'DEF', 2, 25, 'England'),
  player(22, 'Andy Robertson', 'DEF', 2, 30, 'Scotland'),
  player(23, 'Alexis Mac Allister', 'MID', 2, 25, 'Argentina'),
  player(24, 'Dominik Szoboszlai', 'MID', 2, 23, 'Hungary'),
  player(25, 'Mohamed Salah', 'FWD', 2, 31, 'Egypt'),
  player(26, 'Darwin Nunez', 'FWD', 2, 25, 'Uruguay'),
  player(27, 'Ederson', 'GK', 3, 30, 'Brazil'),
  player(28, 'Ruben Dias', 'DEF', 3, 27, 'Portugal'),
  player(29, 'Kyle Walker', 'DEF', 3, 33, 'England'),
  player(30, 'Rodri', 'MID', 3, 28, 'Spain'),
  player(31, 'Kevin De Bruyne', 'MID', 3, 32, 'Belgium'),
  player(32, 'Phil Foden', 'MID', 3, 24, 'England'),
  player(33, 'Erling Haaland', 'FWD', 3, 24, 'Norway'),
  player(34, 'Guglielmo Vicario', 'GK', 4, 27, 'Italy'),
  player(35, 'Cristian Romero', 'DEF', 4, 26, 'Argentina'),
  player(36, 'James Maddison', 'MID', 4, 27, 'England'),
  player(37, 'Son Heung-min', 'FWD', 4, 31, 'South Korea'),
  player(38, 'Andre Onana', 'GK', 5, 28, 'Cameroon'),
  player(39, 'Bruno Fernandes', 'MID', 5, 29, 'Portugal'),
  player(40, 'Marcus Rashford', 'FWD', 5, 26, 'England'),
];

function toSlot(p: Player, isCaptain = false): PlayerSlot {
  return {
    apiPlayerId: p.id,
    name: p.name,
    position: p.position,
    teamId: p.team?.id,
    teamName: p.team?.name,
    photo: p.photo,
    isCaptain,
  };
}

export const SEED_USERS: User[] = [
  { id: 'user-sample', email: 'manager@example.com', displayName: 'Team Manager' },
  { id: 'user-2', email: 'sarah@example.com', displayName: 'Sarah K.' },
  { id: 'user-3', email: 'mike@example.com', displayName: 'Mike T.' },
  { id: 'user-4', email: 'jade@example.com', displayName: 'Jade R.' },
];

export const SEED_LEAGUES: League[] = [
  {
    _id: 'league-1',
    name: 'Office League',
    code: 'OFFICE',
    owner: 'user-2',
    season: 2024,
    createdAt: '2024-08-01T00:00:00.000Z',
  },
  {
    _id: 'league-2',
    name: 'Weekend Warriors',
    code: SAMPLE_LEAGUE_CODE,
    owner: 'user-3',
    season: 2024,
    createdAt: '2024-09-15T00:00:00.000Z',
  },
];

function buildTeam(
  id: string,
  name: string,
  owner: string,
  playerIds: number[],
  captainId: number,
  formation: Team['formation'] = '4-4-2'
): Team {
  const players = playerIds.map((pid) => {
    const p = SEED_PLAYERS.find((x) => x.id === pid)!;
    return toSlot(p, pid === captainId);
  });
  return {
    _id: id,
    name,
    formation,
    players,
    owner,
    leagueRef: 'league-1',
    createdAt: '2024-08-20T00:00:00.000Z',
    updatedAt: '2024-08-20T00:00:00.000Z',
  };
}

export const SEED_TEAMS: Team[] = [
  buildTeam('team-1', 'North London XI', 'user-sample', [1, 2, 3, 4, 5, 6, 7, 8, 39, 9, 10], 8, '4-4-2'),
  buildTeam('team-2', 'Blue Army FC', 'user-2', [11, 12, 13, 14, 29, 15, 16, 17, 18, 37, 40], 17, '4-3-3'),
  buildTeam('team-3', 'Red Machine', 'user-3', [19, 20, 21, 22, 35, 23, 24, 36, 25, 26, 39], 25, '4-3-3'),
  buildTeam('team-4', 'Sky Blues', 'user-4', [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38], 33, '4-3-3'),
];

export function buildMemberships(): Membership[] {
  return [
    {
      _id: 'mem-1',
      league: SEED_LEAGUES[0],
      user: SEED_USERS[0],
      teamRef: SEED_TEAMS[0],
      joinedAt: '2024-08-25T00:00:00.000Z',
    },
    {
      _id: 'mem-2',
      league: SEED_LEAGUES[0],
      user: SEED_USERS[1],
      teamRef: SEED_TEAMS[1],
      joinedAt: '2024-08-26T00:00:00.000Z',
    },
    {
      _id: 'mem-3',
      league: SEED_LEAGUES[0],
      user: SEED_USERS[2],
      teamRef: SEED_TEAMS[2],
      joinedAt: '2024-08-27T00:00:00.000Z',
    },
    {
      _id: 'mem-4',
      league: SEED_LEAGUES[0],
      user: SEED_USERS[3],
      teamRef: SEED_TEAMS[3],
      joinedAt: '2024-08-28T00:00:00.000Z',
    },
  ];
}

export const SEED_SCORES: Record<string, GameweekScore> = {
  'team-1:1': {
    points: 62,
    isFinal: false,
    breakdown: [
      { apiPlayerId: 8, playerName: 'Bukayo Saka', event: 'goal', points: 5 },
      { apiPlayerId: 8, playerName: 'Bukayo Saka', event: 'captainBonus', points: 5 },
      { apiPlayerId: 7, playerName: 'Martin Odegaard', event: 'assist', points: 3 },
      { apiPlayerId: 2, playerName: 'William Saliba', event: 'cleanSheet', points: 4 },
    ],
  },
  'team-2:1': { points: 48, isFinal: false, breakdown: [] },
  'team-3:1': { points: 71, isFinal: false, breakdown: [] },
  'team-4:1': { points: 55, isFinal: false, breakdown: [] },
};

export const SEED_STANDINGS: StandingRow[] = [
  { rank: 1, team: { id: 50, name: 'Man City', logo: clubs[3].logo }, points: 38, goalsDiff: 22, all: { played: 15, win: 12, draw: 2, lose: 1 }, form: 'WWWDW' },
  { rank: 2, team: { id: 42, name: 'Arsenal', logo: clubs[0].logo }, points: 33, goalsDiff: 18, all: { played: 15, win: 10, draw: 3, lose: 2 }, form: 'WDWWL' },
  { rank: 3, team: { id: 40, name: 'Liverpool', logo: clubs[2].logo }, points: 32, goalsDiff: 15, all: { played: 15, win: 9, draw: 5, lose: 1 }, form: 'DWWWD' },
  { rank: 4, team: { id: 47, name: 'Tottenham', logo: clubs[4].logo }, points: 27, goalsDiff: 5, all: { played: 15, win: 8, draw: 3, lose: 4 }, form: 'LWWDL' },
  { rank: 5, team: { id: 49, name: 'Chelsea', logo: clubs[1].logo }, points: 24, goalsDiff: 3, all: { played: 15, win: 7, draw: 3, lose: 5 }, form: 'WLWDL' },
  { rank: 6, team: { id: 33, name: 'Man United', logo: clubs[5].logo }, points: 22, goalsDiff: -2, all: { played: 15, win: 6, draw: 4, lose: 5 }, form: 'DLWWD' },
  { rank: 7, team: { id: 66, name: 'Aston Villa', logo: '' }, points: 21, goalsDiff: 1, all: { played: 15, win: 6, draw: 3, lose: 6 }, form: 'WLDWL' },
  { rank: 8, team: { id: 34, name: 'Newcastle', logo: '' }, points: 20, goalsDiff: 0, all: { played: 15, win: 5, draw: 5, lose: 5 }, form: 'DDWLW' },
  { rank: 9, team: { id: 51, name: 'Brighton', logo: '' }, points: 19, goalsDiff: -1, all: { played: 15, win: 5, draw: 4, lose: 6 }, form: 'LDWDL' },
  { rank: 10, team: { id: 48, name: 'West Ham', logo: '' }, points: 18, goalsDiff: -3, all: { played: 15, win: 5, draw: 3, lose: 7 }, form: 'LLWWD' },
  { rank: 11, team: { id: 36, name: 'Fulham', logo: '' }, points: 17, goalsDiff: -2, all: { played: 15, win: 4, draw: 5, lose: 6 }, form: 'DDLWW' },
  { rank: 12, team: { id: 45, name: 'Everton', logo: '' }, points: 16, goalsDiff: -5, all: { played: 15, win: 4, draw: 4, lose: 7 }, form: 'WLLDD' },
  { rank: 13, team: { id: 55, name: 'Brentford', logo: '' }, points: 15, goalsDiff: -4, all: { played: 15, win: 4, draw: 3, lose: 8 }, form: 'LWLWL' },
  { rank: 14, team: { id: 52, name: 'Crystal Palace', logo: '' }, points: 14, goalsDiff: -6, all: { played: 15, win: 3, draw: 5, lose: 7 }, form: 'DDLDW' },
  { rank: 15, team: { id: 65, name: 'Nottingham Forest', logo: '' }, points: 13, goalsDiff: -8, all: { played: 15, win: 3, draw: 4, lose: 8 }, form: 'LDLLW' },
  { rank: 16, team: { id: 39, name: 'Wolves', logo: '' }, points: 12, goalsDiff: -10, all: { played: 15, win: 3, draw: 3, lose: 9 }, form: 'LLWLD' },
  { rank: 17, team: { id: 35, name: 'Bournemouth', logo: '' }, points: 11, goalsDiff: -12, all: { played: 15, win: 2, draw: 5, lose: 8 }, form: 'DLLDL' },
  { rank: 18, team: { id: 41, name: 'Southampton', logo: '' }, points: 8, goalsDiff: -18, all: { played: 15, win: 1, draw: 5, lose: 9 }, form: 'LLDDL' },
  { rank: 19, team: { id: 57, name: 'Ipswich', logo: '' }, points: 7, goalsDiff: -20, all: { played: 15, win: 1, draw: 4, lose: 10 }, form: 'LLLLD' },
  { rank: 20, team: { id: 44, name: 'Leicester', logo: '' }, points: 6, goalsDiff: -22, all: { played: 15, win: 1, draw: 3, lose: 11 }, form: 'LLLLL' },
];

export function buildFixtures(date: string): Fixture[] {
  const base = `${date}T`;
  return [
    {
      fixture: { id: 101, date: `${base}12:30:00Z`, status: { short: '2H', long: 'Second Half' } },
      league: { id: 39, name: 'Premier League', logo: '' },
      teams: { home: { id: 42, name: 'Arsenal', logo: clubs[0].logo }, away: { id: 49, name: 'Chelsea', logo: clubs[1].logo } },
      goals: { home: 2, away: 1 },
      events: [
        { time: { elapsed: 12 }, team: { id: 42, name: 'Arsenal' }, player: { id: 8, name: 'Bukayo Saka' }, type: 'Goal', detail: 'Normal Goal' },
        { time: { elapsed: 34 }, team: { id: 49, name: 'Chelsea' }, player: { id: 17, name: 'Cole Palmer' }, type: 'Goal', detail: 'Normal Goal' },
        { time: { elapsed: 67 }, team: { id: 42, name: 'Arsenal' }, player: { id: 9, name: 'Gabriel Jesus' }, type: 'Goal', detail: 'Normal Goal' },
      ],
    },
    {
      fixture: { id: 102, date: `${base}15:00:00Z`, status: { short: '1H', long: 'First Half' } },
      league: { id: 39, name: 'Premier League', logo: '' },
      teams: { home: { id: 40, name: 'Liverpool', logo: clubs[2].logo }, away: { id: 33, name: 'Man United', logo: clubs[5].logo } },
      goals: { home: 1, away: 0 },
      events: [
        { time: { elapsed: 23 }, team: { id: 40, name: 'Liverpool' }, player: { id: 25, name: 'Mohamed Salah' }, type: 'Goal', detail: 'Normal Goal' },
      ],
    },
    {
      fixture: { id: 103, date: `${base}17:30:00Z`, status: { short: 'NS', long: 'Not Started' } },
      league: { id: 39, name: 'Premier League', logo: '' },
      teams: { home: { id: 50, name: 'Man City', logo: clubs[3].logo }, away: { id: 47, name: 'Tottenham', logo: clubs[4].logo } },
      goals: { home: null, away: null },
    },
    {
      fixture: { id: 104, date: `${base}20:00:00Z`, status: { short: 'NS', long: 'Not Started' } },
      league: { id: 39, name: 'Premier League', logo: '' },
      teams: { home: { id: 49, name: 'Chelsea', logo: clubs[1].logo }, away: { id: 66, name: 'Aston Villa', logo: '' } },
      goals: { home: null, away: null },
    },
    {
      fixture: { id: 105, date: `${base}14:00:00Z`, status: { short: 'NS', long: 'Not Started' } },
      league: { id: 39, name: 'Premier League', logo: '' },
      teams: { home: { id: 34, name: 'Newcastle', logo: '' }, away: { id: 51, name: 'Brighton', logo: '' } },
      goals: { home: null, away: null },
    },
    {
      fixture: { id: 106, date: `${base}12:00:00Z`, status: { short: 'FT', long: 'Match Finished' } },
      league: { id: 39, name: 'Premier League', logo: '' },
      teams: { home: { id: 48, name: 'West Ham', logo: '' }, away: { id: 36, name: 'Fulham', logo: '' } },
      goals: { home: 0, away: 0 },
    },
    {
      fixture: { id: 107, date: `${base}12:00:00Z`, status: { short: 'FT', long: 'Match Finished' } },
      league: { id: 39, name: 'Premier League', logo: '' },
      teams: { home: { id: 45, name: 'Everton', logo: '' }, away: { id: 55, name: 'Brentford', logo: '' } },
      goals: { home: 2, away: 1 },
    },
    {
      fixture: { id: 108, date: `${base}12:00:00Z`, status: { short: 'FT', long: 'Match Finished' } },
      league: { id: 39, name: 'Premier League', logo: '' },
      teams: { home: { id: 52, name: 'Crystal Palace', logo: '' }, away: { id: 39, name: 'Wolves', logo: '' } },
      goals: { home: 1, away: 3 },
    },
  ];
}

export const CURRENT_GAMEWEEK = 12;
