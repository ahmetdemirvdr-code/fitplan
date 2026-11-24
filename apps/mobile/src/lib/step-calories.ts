/**
 * MET-based walking calorie estimate from step count.
 * Default cadence 110 steps/min → ~3.5 MET (normal walk).
 */

export function calculateStepCalories(input: {
  steps: number;
  weightKg: number;
  heightCm: number;
  durationMinutes?: number;
}): { calories: number; distanceKm: number; met: number } {
  const steps = Math.max(0, Math.floor(input.steps));
  const weightKg = Math.max(1, input.weightKg || 70);
  const heightCm = Math.max(100, input.heightCm || 170);

  const strideM = (heightCm * 0.415) / 100;
  const distanceM = steps * strideM;
  const distanceKm = distanceM / 1000;

  const durationMinutes =
    input.durationMinutes && input.durationMinutes > 0
      ? input.durationMinutes
      : steps / 110;

  const hours = durationMinutes / 60;
  const cadence = durationMinutes > 0 ? steps / durationMinutes : 110;

  let met = 3.5;
  if (input.durationMinutes && input.durationMinutes > 0) {
    if (cadence < 100) met = 2.8;
    else if (cadence > 120) met = 5.0;
    else met = 3.5;
  }

  const calories = met * weightKg * hours;

  return {
    calories: Math.round(calories),
    distanceKm: Math.round(distanceKm * 100) / 100,
    met,
  };
}
