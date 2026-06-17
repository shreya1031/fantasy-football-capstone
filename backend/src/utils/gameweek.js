import { env } from '../config/env.js';

export function getSeasonStartDate() {
  return new Date(env.SEASON_START_DATE);
}

export function dateToGameweek(dateInput = new Date()) {
  const date = new Date(dateInput);
  const seasonStart = getSeasonStartDate();
  const diffMs = date.getTime() - seasonStart.getTime();
  if (diffMs < 0) return 1;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

export function gameweekToDateRange(gameweek) {
  const seasonStart = getSeasonStartDate();
  const start = new Date(seasonStart);
  start.setDate(start.getDate() + (gameweek - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function getCurrentGameweek() {
  return dateToGameweek(new Date());
}

export function getGameweekDates(gameweek) {
  const { start, end } = gameweekToDateRange(gameweek);
  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
