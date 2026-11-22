/** Calendar week index since plan start (1-based). */
export function getPlanWeekNumber(planCreatedAt: Date, now = new Date()): number {
  const start = new Date(planCreatedAt);
  start.setHours(0, 0, 0, 0);
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

/**
 * Workout days are stored per phase start week (e.g. 1, 5, 13).
 * Pick the latest phase whose startWeek <= current plan week.
 */
export function resolvePhaseWeekNumber(
  availableWeekNumbers: number[],
  planWeek: number
): number {
  const phases = [...new Set(availableWeekNumbers)]
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  if (phases.length === 0) return 1;
  let best = phases[0];
  for (const w of phases) {
    if (w <= planWeek) best = w;
    else break;
  }
  return best;
}
