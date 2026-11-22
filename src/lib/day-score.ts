export type DayScoreLevel = "empty" | "low" | "ok" | "good";

export type DayScoreBreakdown = {
  workout: number;
  water: number;
  nutrition: number;
};

export type DayScoreInput = {
  workoutNeeded: boolean;
  workoutCompleted: boolean;
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

/** Max points per pillar — total 100 */
export const SCORE_MAX = {
  workout: 40,
  water: 30,
  nutrition: 30,
} as const;

export function computeDayScore(input: DayScoreInput): DayScoreResult {
  // Workout: rest day = full credit; training day = all-or-nothing
  const workoutPts = input.workoutNeeded
    ? input.workoutCompleted
      ? SCORE_MAX.workout
      : 0
    : SCORE_MAX.workout;

  // Water: linear to target, capped
  const waterRatio =
    input.waterTargetMl > 0
      ? Math.min(1, input.waterMl / input.waterTargetMl)
      : 0;
  const waterPts = Math.round(SCORE_MAX.water * waterRatio);

  // Nutrition: log meals + how close calories are to target
  let nutritionPts = 0;
  if (input.mealsLogged > 0) {
    nutritionPts += 12; // logging effort
    if (input.calorieTarget > 0 && input.calories > 0) {
      const ratio = input.calories / input.calorieTarget;
      // Peak at 0.85–1.15 of target
      let closeness = 0;
      if (ratio >= 0.85 && ratio <= 1.15) closeness = 1;
      else if (ratio >= 0.7 && ratio < 0.85) closeness = 0.6;
      else if (ratio > 1.15 && ratio <= 1.3) closeness = 0.6;
      else if (ratio >= 0.5) closeness = 0.3;
      nutritionPts += Math.round(18 * closeness);
    } else {
      nutritionPts += 6; // logged but no calorie target context
    }
  }

  const score = Math.min(
    100,
    workoutPts + waterPts + nutritionPts
  );

  let level: DayScoreLevel = "empty";
  const hasAnyActivity =
    input.workoutCompleted ||
    input.waterMl > 0 ||
    input.mealsLogged > 0;

  if (!hasAnyActivity && input.workoutNeeded) {
    level = "empty";
  } else if (!hasAnyActivity && !input.workoutNeeded) {
    // Rest day with zero logs — still partial via workout credit only if we count rest
    // Treat untouched rest as empty until user opens the day / logs something
    level = "empty";
  } else if (score >= 75) level = "good";
  else if (score >= 40) level = "ok";
  else level = "low";

  // If rest day and user logged nothing, score shows workout credit but level empty
  // Recompute: if only rest credit and nothing else, mark empty for calendar
  if (!hasAnyActivity) {
    return {
      score: 0,
      level: "empty",
      points: { workout: 0, water: 0, nutrition: 0 },
    };
  }

  return {
    score,
    level,
    points: {
      workout: workoutPts,
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
    return "⭐ Bugün neredeyse mükemmel — antrenman, su ve beslenme dengede.";
  }
  if (todayScore >= 60) {
    return "👍 İyi gidiyorsun. Eksik kalan hedefi tamamlayınca puanın daha da artar.";
  }
  if (todayScore > 0 && todayScore < 40) {
    return "🌱 Başlangıç yapıldı. Su veya bir öğün eklemek puanını hızla yükseltir.";
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
