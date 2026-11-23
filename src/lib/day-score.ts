export type DayScoreLevel = "empty" | "low" | "ok" | "good";

export type DayScoreBreakdown = {
  workout: number;
  steps: number;
  water: number;
  nutrition: number;
};

export type DayScoreInput = {
  workoutNeeded: boolean;
  workoutCompleted: boolean;
  steps: number;
  stepTarget: number;
  /** When false, keep legacy 40/30/30 scoring (no step data logged). */
  hasStepData: boolean;
  waterMl: number;
  waterTargetMl: number;
  calories: number;
  calorieTarget: number;
  mealsLogged: number;
};

export type DayScoreResult = {
  score: number;
  level: DayScoreLevel;
  points: DayScoreBreakdown;
};

/** Max points when step tracking is in use — total 100 */
export const SCORE_MAX = {
  workout: 30,
  steps: 15,
  water: 25,
  nutrition: 30,
} as const;

/** Legacy pillars when user has no step logs that day */
export const SCORE_MAX_LEGACY = {
  workout: 40,
  steps: 0,
  water: 30,
  nutrition: 30,
} as const;

export function computeDayScore(input: DayScoreInput): DayScoreResult {
  const caps = input.hasStepData ? SCORE_MAX : SCORE_MAX_LEGACY;

  const workoutPts = input.workoutNeeded
    ? input.workoutCompleted
      ? caps.workout
      : 0
    : caps.workout;

  const stepRatio =
    input.stepTarget > 0 ? Math.min(1, input.steps / input.stepTarget) : 0;
  const stepPts = input.hasStepData
    ? Math.round(caps.steps * stepRatio)
    : 0;

  const waterRatio =
    input.waterTargetMl > 0
      ? Math.min(1, input.waterMl / input.waterTargetMl)
      : 0;
  const waterPts = Math.round(caps.water * waterRatio);

  let nutritionPts = 0;
  if (input.mealsLogged > 0) {
    nutritionPts += 12;
    if (input.calorieTarget > 0 && input.calories > 0) {
      const ratio = input.calories / input.calorieTarget;
      let closeness = 0;
      if (ratio >= 0.85 && ratio <= 1.15) closeness = 1;
      else if (ratio >= 0.7 && ratio < 0.85) closeness = 0.6;
      else if (ratio > 1.15 && ratio <= 1.3) closeness = 0.6;
      else if (ratio >= 0.5) closeness = 0.3;
      nutritionPts += Math.round(18 * closeness);
    } else {
      nutritionPts += 6;
    }
  }

  const score = Math.min(100, workoutPts + stepPts + waterPts + nutritionPts);

  const hasAnyActivity =
    input.workoutCompleted ||
    input.waterMl > 0 ||
    input.mealsLogged > 0 ||
    input.steps > 0;

  if (!hasAnyActivity) {
    return {
      score: 0,
      level: "empty",
      points: { workout: 0, steps: 0, water: 0, nutrition: 0 },
    };
  }

  let level: DayScoreLevel = "low";
  if (score >= 75) level = "good";
  else if (score >= 40) level = "ok";

  return {
    score,
    level,
    points: {
      workout: workoutPts,
      steps: stepPts,
      water: waterPts,
      nutrition: nutritionPts,
    },
  };
}

export function encouragementFor(opts: {
  todayScore: number;
  streak: number;
  weekAvg: number;
}): string {
  const { todayScore, streak, weekAvg } = opts;
  if (streak >= 7) {
    return `🔥 ${streak} günlük seri! Ritmin çok iyi — böyle devam.`;
  }
  if (streak >= 3) {
    return `💪 ${streak} gündür hedeflerine yaklaşıyorsun. Seriyi bozma.`;
  }
  if (todayScore >= 85) {
    return "⭐ Bugün neredeyse mükemmel — antrenman, adım, su ve beslenme dengede.";
  }
  if (todayScore >= 60) {
    return "👍 İyi gidiyorsun. Eksik kalan hedefi tamamlayınca puanın daha da artar.";
  }
  if (todayScore > 0 && todayScore < 40) {
    return "🌱 Başlangıç yapıldı. Su veya adım eklemek puanını hızla yükseltir.";
  }
  if (weekAvg >= 70) {
    return "📈 Bu hafta ortalaman güçlü. Bugünü de işaretleyelim.";
  }
  return "🎯 Her gün küçük adımlar büyük fark yaratır. Bugünün hedefini tamamla.";
}

export function levelColor(level: DayScoreLevel): string {
  switch (level) {
    case "good":
      return "#2ECC71";
    case "ok":
      return "#F1C40F";
    case "low":
      return "#E74C3C";
    default:
      return "#243044";
  }
}
