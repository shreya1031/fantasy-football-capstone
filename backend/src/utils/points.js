export const SCORING_RULES = {
  goal: { GK: 6, DEF: 6, MID: 5, FWD: 4 },
  assist: 3,
  cleanSheet: { GK: 4, DEF: 4, MID: 1, FWD: 0 },
  savePer3: 1,
  yellowCard: -1,
  redCard: -3,
  ownGoal: -2,
  penaltyMiss: -2,
  minutesPlayed: 1,
  minutesThreshold: 60,
};

export function calculatePlayerPoints(stats, position, isCaptain = false) {
  let points = 0;
  const breakdown = [];

  const add = (event, value) => {
    if (value === 0) return;
    points += value;
    breakdown.push({ event, points: value });
  };

  const goals = stats.goals ?? 0;
  const assists = stats.assists ?? 0;
  const saves = stats.saves ?? 0;
  const minutes = stats.minutes ?? 0;
  const yellow = stats.yellowCards ?? 0;
  const red = stats.redCards ?? 0;
  const conceded = stats.goalsConceded ?? 0;

  if (goals > 0) {
    add('goal', goals * (SCORING_RULES.goal[position] ?? 4));
  }
  if (assists > 0) {
    add('assist', assists * SCORING_RULES.assist);
  }
  if (minutes >= SCORING_RULES.minutesThreshold) {
    add('appearance', SCORING_RULES.minutesPlayed);
  }
  if (position === 'GK' || position === 'DEF') {
    if (minutes >= SCORING_RULES.minutesThreshold && conceded === 0) {
      add('cleanSheet', SCORING_RULES.cleanSheet[position] ?? 0);
    }
  }
  if (position === 'GK' && saves >= 3) {
    add('saves', Math.floor(saves / 3) * SCORING_RULES.savePer3);
  }
  if (yellow > 0) {
    add('yellowCard', yellow * SCORING_RULES.yellowCard);
  }
  if (red > 0) {
    add('redCard', red * SCORING_RULES.redCard);
  }

  if (isCaptain && points > 0) {
    add('captainBonus', points);
  }

  return { points, breakdown };
}

export function aggregateBreakdown(entries) {
  return entries.flatMap((entry) =>
    entry.breakdown.map((item) => ({
      ...item,
      apiPlayerId: entry.apiPlayerId,
      playerName: entry.playerName,
      fixtureId: entry.fixtureId,
    }))
  );
}
