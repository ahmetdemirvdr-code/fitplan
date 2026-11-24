import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import {
  computeDayScore,
  encouragementFor,
  type DayScoreLevel,
} from "@/lib/day-score";
import { getPlanWeekNumber, resolvePhaseWeekNumber } from "@/lib/plan-week";

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toPlanDow(date: Date) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const now = new Date();
  const year = Number(params.get("year")) || now.getFullYear();
  const month = Number(params.get("month"));
  const monthIndex =
    Number.isFinite(month) && month >= 1 && month <= 12
      ? month - 1
      : now.getMonth();

  const rangeStart = new Date(year, monthIndex, 1);
  const rangeEnd = new Date(year, monthIndex + 1, 0);
  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(23, 59, 59, 999);

  const streakLookbackStart = startOfDay(now);
  streakLookbackStart.setDate(streakLookbackStart.getDate() - 90);

  const fetchStart =
    rangeStart < streakLookbackStart ? rangeStart : streakLookbackStart;

  const [plan, profile] = await Promise.all([
    prisma.fitnessPlan.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        workoutDays: {
          select: {
            id: true,
            dayOfWeek: true,
            weekNumber: true,
            name: true,
            isRestDay: true,
          },
        },
      },
    }),
    prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { dailyStepTarget: true },
    }),
  ]);

  const stepTarget = profile?.dailyStepTarget || 10000;

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: user.id,
      date: { gte: fetchStart, lte: rangeEnd > now ? rangeEnd : now },
    },
    include: {
      foodLogs: true,
      waterLogs: true,
      stepLogs: true,
      workoutLogs: {
        include: {
          workoutDay: { select: { name: true } },
        },
      },
    },
  });

  const logByKey = new Map(
    logs.map((log) => [dateKey(new Date(log.date)), log])
  );

  const calorieTarget = plan?.dailyCalorieTarget || 2000;
  const waterTargetMl = Math.round((plan?.dailyWaterTarget || 2.5) * 1000);
  const phaseWeeks = plan
    ? [...new Set(plan.workoutDays.map((d) => d.weekNumber))]
    : [1];

  function scoreForDate(date: Date) {
    const key = dateKey(date);
    const log = logByKey.get(key);

    let workoutNeeded = false;
    let workoutName: string | null = null;

    if (plan) {
      const planWeek = Math.min(
        getPlanWeekNumber(plan.createdAt, date),
        plan.durationWeeks || 12
      );
      const phaseWeek = resolvePhaseWeekNumber(phaseWeeks, planWeek);
      const planDay = plan.workoutDays.find(
        (wd) =>
          wd.weekNumber === phaseWeek && wd.dayOfWeek === toPlanDow(date)
      );
      workoutNeeded = !!planDay && !planDay.isRestDay;
      workoutName = planDay && !planDay.isRestDay ? planDay.name : null;
    }

    const waterMl = log?.waterLogs.reduce((s, w) => s + w.amount, 0) || 0;
    const calories = log?.foodLogs.reduce((s, f) => s + f.calories, 0) || 0;
    const protein = log?.foodLogs.reduce((s, f) => s + f.protein, 0) || 0;
    const mealsLogged = log?.foodLogs.length || 0;
    const totalSteps = log?.stepLogs.reduce((s, st) => s + st.steps, 0) || 0;
    const hasStepData = (log?.stepLogs.length || 0) > 0;
    const workoutCompleted =
      log?.workoutLogs.some((w) => w.isCompleted) || false;

    if (!workoutName && workoutCompleted) {
      workoutName =
        log?.workoutLogs.find((w) => w.isCompleted)?.workoutDay?.name ||
        "Antrenman";
    }

    const scored = computeDayScore({
      workoutNeeded,
      workoutCompleted,
      steps: totalSteps,
      stepTarget,
      hasStepData,
      waterMl,
      waterTargetMl,
      calories,
      calorieTarget,
      mealsLogged,
    });

    return {
      date: key,
      score: scored.score,
      level: scored.level as DayScoreLevel,
      points: scored.points,
      workout: {
        needed: workoutNeeded,
        completed: workoutCompleted,
        name: workoutName,
      },
      steps: {
        count: totalSteps,
        target: stepTarget,
        pct: stepTarget
          ? Math.min(100, Math.round((totalSteps / stepTarget) * 100))
          : 0,
        hasData: hasStepData,
      },
      water: {
        ml: waterMl,
        targetMl: waterTargetMl,
        pct: waterTargetMl
          ? Math.min(100, Math.round((waterMl / waterTargetMl) * 100))
          : 0,
      },
      nutrition: {
        calories,
        target: calorieTarget,
        pct: calorieTarget
          ? Math.min(100, Math.round((calories / calorieTarget) * 100))
          : 0,
        meals: mealsLogged,
        protein: Math.round(protein),
      },
      weight: log?.weight ?? null,
    };
  }

  const daysInMonth = rangeEnd.getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    days.push({ day: d, ...scoreForDate(date) });
  }

  const today = startOfDay(now);
  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const scored = scoreForDate(d);
    if (scored.level === "empty" || scored.score < 40) {
      if (i === 0) continue;
      break;
    }
    streak++;
  }

  const scoredDays = days.filter((d) => d.level !== "empty");
  const monthAvg =
    scoredDays.length > 0
      ? Math.round(
          scoredDays.reduce((s, d) => s + d.score, 0) / scoredDays.length
        )
      : 0;
  const totalPoints = scoredDays.reduce((s, d) => s + d.score, 0);

  const todayKeyStr = dateKey(today);
  const todayDay = days.find((d) => d.date === todayKeyStr);
  const todayScore = todayDay?.score ?? 0;

  const weekCutoff = new Date(today);
  weekCutoff.setDate(today.getDate() - 6);
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekCutoff);
    d.setDate(weekCutoff.getDate() + i);
    if (d > today) break;
    const s = scoreForDate(d);
    if (s.level !== "empty") weekDays.push(s);
  }
  const weekAvg =
    weekDays.length > 0
      ? Math.round(weekDays.reduce((s, d) => s + d.score, 0) / weekDays.length)
      : 0;

  return Response.json({
    year,
    month: monthIndex + 1,
    targets: {
      calorie: calorieTarget,
      waterMl: waterTargetMl,
      waterL: plan?.dailyWaterTarget || 2.5,
      steps: stepTarget,
    },
    days,
    streak,
    monthAvg,
    totalPoints,
    todayScore,
    encouragement: encouragementFor({
      todayScore,
      streak,
      weekAvg,
    }),
  });
}
