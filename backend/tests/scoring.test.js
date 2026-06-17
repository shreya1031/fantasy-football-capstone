import { calculatePlayerPoints } from '../src/utils/points.js';

describe('Scoring engine', () => {
  it('calculates forward goal and assist points', () => {
    const result = calculatePlayerPoints(
      { goals: 1, assists: 1, minutes: 90, yellowCards: 0, redCards: 0, saves: 0, goalsConceded: 0 },
      'FWD',
      false
    );

    expect(result.points).toBe(8);
  });

  it('applies captain multiplier', () => {
    const result = calculatePlayerPoints(
      { goals: 1, assists: 0, minutes: 90, yellowCards: 0, redCards: 0, saves: 0, goalsConceded: 0 },
      'FWD',
      true
    );

    expect(result.points).toBe(10);
  });

  it('awards clean sheet to defender', () => {
    const result = calculatePlayerPoints(
      { goals: 0, assists: 0, minutes: 90, yellowCards: 0, redCards: 0, saves: 0, goalsConceded: 0 },
      'DEF',
      false
    );

    expect(result.points).toBe(5);
  });
});
