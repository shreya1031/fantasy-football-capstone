import { deriveMatchPlayerStats, normalizePosition } from '../src/services/sportsData.js';

const match = {
  score: { fullTime: { home: 2, away: 1 } },
  homeTeam: {
    id: 10,
    lineup: [
      { id: 1, name: 'Home Keeper' },
      { id: 2, name: 'Home Scorer' },
      { id: 3, name: 'Home Subbed Off' },
    ],
    bench: [{ id: 4, name: 'Home Sub In' }],
  },
  awayTeam: {
    id: 20,
    lineup: [
      { id: 5, name: 'Away Keeper' },
      { id: 6, name: 'Away Carded' },
    ],
    bench: [{ id: 7, name: 'Away Unused Sub' }],
  },
  goals: [
    { minute: 30, type: 'REGULAR', team: { id: 10 }, scorer: { id: 2 }, assist: { id: 3 } },
    { minute: 55, type: 'PENALTY', team: { id: 10 }, scorer: { id: 2 }, assist: null },
    { minute: 80, type: 'REGULAR', team: { id: 20 }, scorer: { id: 6 }, assist: null },
  ],
  bookings: [
    { minute: 40, team: { id: 20 }, player: { id: 6 }, card: 'YELLOW' },
    { minute: 85, team: { id: 20 }, player: { id: 6 }, card: 'YELLOW_RED' },
  ],
  substitutions: [
    { minute: 60, team: { id: 10 }, playerOut: { id: 3 }, playerIn: { id: 4 } },
  ],
};

describe('deriveMatchPlayerStats', () => {
  const stats = deriveMatchPlayerStats(match);

  it('credits goals and assists from the event stream', () => {
    expect(stats.get(2)).toMatchObject({ goals: 2, assists: 0 });
    expect(stats.get(3)).toMatchObject({ goals: 0, assists: 1 });
  });

  it('derives minutes from lineups and substitutions', () => {
    expect(stats.get(1).minutes).toBe(90);
    expect(stats.get(3).minutes).toBe(60);
    expect(stats.get(4).minutes).toBe(30);
    expect(stats.get(7).minutes).toBe(0);
  });

  it('assigns goals conceded from the final score to players who played', () => {
    expect(stats.get(1).goalsConceded).toBe(1);
    expect(stats.get(5).goalsConceded).toBe(2);
    expect(stats.get(7).goalsConceded).toBe(0);
  });

  it('counts cards, treating a second yellow as a red', () => {
    expect(stats.get(6)).toMatchObject({ yellowCards: 1, redCards: 1 });
  });

  it('reports zero saves since the API does not provide them', () => {
    expect(stats.get(1).saves).toBe(0);
  });
});

describe('normalizePosition', () => {
  it('maps coarse and granular position names', () => {
    expect(normalizePosition('Goalkeeper')).toBe('GK');
    expect(normalizePosition('Defence')).toBe('DEF');
    expect(normalizePosition('Centre-Back')).toBe('DEF');
    expect(normalizePosition('Central Midfield')).toBe('MID');
    expect(normalizePosition('Offence')).toBe('FWD');
    expect(normalizePosition('Left Winger')).toBe('FWD');
    expect(normalizePosition('Centre-Forward')).toBe('FWD');
    expect(normalizePosition(undefined)).toBe('MID');
  });
});
