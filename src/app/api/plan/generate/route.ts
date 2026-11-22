import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  callOpenRouterDetailed,
  buildFitnessPlanPrompt,
  buildImportWorkoutPrompt,
  buildMealPlanPrompt,
} from "@/lib/openrouter";
import { AiBudgetExceededError } from "@/lib/ai-usage";

interface AIExercise {
  name: string;
  nameEn: string;
  sets: number;
  reps: string;
  weight?: string | null;
  restSeconds: number;
  description: string;
}

interface AIWorkoutDay {
  dayOfWeek: number;
  name: string;
  isRestDay: boolean;
  exercises?: AIExercise[];
}

interface AIMeal {
  mealType: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AIMealDay {
  dayOfWeek: number;
  meals: AIMeal[];
}

interface AIPlanResponse {
  dailyCalorieTarget: number;
  dailyWaterTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  durationWeeks?: number;
  workoutPlan: AIWorkoutDay[];
  mealPlan: AIMealDay[];
}

interface AIImportPhase {
  name: string;
  startWeek: number;
  endWeek: number;
  workoutDays: AIWorkoutDay[];
}

interface AIImportWorkoutResponse {
  durationWeeks?: number;
  phases: AIImportPhase[];
}

interface AIMealOnlyResponse {
  dailyCalorieTarget: number;
  dailyWaterTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  mealPlan: AIMealDay[];
}

function parseJson<T>(text: string): T {
  return JSON.parse(text) as T;
}

async function callJson<T>(
  messages: Parameters<typeof callOpenRouterDetailed>[0],
  options: Parameters<typeof callOpenRouterDetailed>[1]
): Promise<T> {
  const first = await callOpenRouterDetailed(messages, options);
  try {
    return parseJson<T>(first.content);
  } catch {
    const retry = await callOpenRouterDetailed(messages, {
      ...options,
      temperature: 0.2,
    });
    return parseJson<T>(retry.content);
  }
}

function ensureFullWeek(days: AIWorkoutDay[]): AIWorkoutDay[] {
  const byDow = new Map(days.map((d) => [d.dayOfWeek, d]));
  const full: AIWorkoutDay[] = [];
  for (let dow = 1; dow <= 7; dow++) {
    full.push(
      byDow.get(dow) || {
        dayOfWeek: dow,
        name: "Dinlenme",
        isRestDay: true,
        exercises: [],
      }
    );
  }
  return full;
}

function toWeightString(weight: unknown): string | null {
  if (weight === null || weight === undefined || weight === "") return null;
  if (typeof weight === "number") {
    return Number.isFinite(weight) ? `${weight} kg` : null;
  }
  const s = String(weight).trim();
  return s || null;
}

function normalizeMealType(
  mealType: string
): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" {
  const key = String(mealType || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (key === "BREAKFAST" || key === "LUNCH" || key === "DINNER" || key === "SNACK") {
    return key;
  }
  if (key.includes("SABAH") || key.includes("KAHVALTI")) return "BREAKFAST";
  if (key.includes("OGLE") || key.includes("ÖĞLE") || key.includes("LUNCH")) return "LUNCH";
  if (key.includes("AKSAM") || key.includes("AKŞAM") || key.includes("DINNER")) return "DINNER";
  return "SNACK";
}

function normalizeExercise(ex: AIExercise, idx: number) {
  return {
    name: String(ex.name || `Hareket ${idx + 1}`),
    nameEn: String(ex.nameEn || ex.name || `Exercise ${idx + 1}`),
    sets: Math.max(1, Number(ex.sets) || 1),
    reps: String(ex.reps ?? ""),
    weight: toWeightString(ex.weight),
    restSeconds: Math.max(0, Number(ex.restSeconds) || 60),
    order: idx + 1,
    description: String(ex.description || ""),
  };
}

function flattenImportPhases(
  imported: AIImportWorkoutResponse
): { durationWeeks: number; workoutDays: Array<AIWorkoutDay & { weekNumber: number }> } {
  const phases = (imported.phases || []).filter(
    (p) => p && Array.isArray(p.workoutDays) && p.workoutDays.length > 0
  );

  if (phases.length === 0) {
    throw new Error("Import response missing phases");
  }

  const maxEnd = Math.max(...phases.map((p) => p.endWeek || p.startWeek || 1));
  const durationWeeks = imported.durationWeeks || maxEnd || 12;

  const workoutDays: Array<AIWorkoutDay & { weekNumber: number }> = [];

  for (const phase of phases) {
    const weekNumber = Math.max(1, phase.startWeek || 1);
    for (const day of ensureFullWeek(phase.workoutDays)) {
      workoutDays.push({
        ...day,
        weekNumber,
        name: day.isRestDay
          ? day.name || "Dinlenme"
          : phase.name
            ? `${day.name}`
            : day.name,
      });
    }
  }

  return { durationWeeks, workoutDays };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      existingProgram?: string;
    };
    const existingProgram = body.existingProgram?.trim() || undefined;

    if (existingProgram && existingProgram.length < 40) {
      return Response.json(
        { error: "Mevcut program en az birkaç satır olmalı" },
        { status: 400 }
      );
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return Response.json(
        { error: "Önce profilinizi oluşturun" },
        { status: 400 }
      );
    }

    // Do NOT deactivate the current plan until the new one is ready.
    // Otherwise a failed/cancelled generate leaves the user with no plan.
    let durationWeeks = 12;
    let workoutDaysToCreate: Array<AIWorkoutDay & { weekNumber: number }> = [];
    let mealPlan: AIMealDay[] = [];
    let macros = {
      dailyCalorieTarget: 2000,
      dailyWaterTarget: 3,
      proteinTarget: 120,
      carbTarget: 200,
      fatTarget: 70,
    };
    let rawAIResponse: unknown;

    if (existingProgram) {
      // 1) Workouts only — preserve every exercise / phase
      const importMessages = buildImportWorkoutPrompt(
        profile as unknown as Record<string, unknown>,
        existingProgram
      );
      const imported = await callJson<AIImportWorkoutResponse>(importMessages, {
        maxTokens: 16000,
        temperature: 0.2,
        userId: session.user.id,
        purpose: "plan_import_workout",
      });

      const flattened = flattenImportPhases(imported);
      durationWeeks = flattened.durationWeeks;
      workoutDaysToCreate = flattened.workoutDays;

      // 2) Meals separately so they never steal tokens from exercises
      try {
        const mealMessages = buildMealPlanPrompt(
          profile as unknown as Record<string, unknown>
        );
        const meals = await callJson<AIMealOnlyResponse>(mealMessages, {
          maxTokens: 4096,
          temperature: 0.5,
          userId: session.user.id,
          purpose: "plan_import_meals",
        });
        macros = {
          dailyCalorieTarget: meals.dailyCalorieTarget,
          dailyWaterTarget: meals.dailyWaterTarget,
          proteinTarget: meals.proteinTarget,
          carbTarget: meals.carbTarget,
          fatTarget: meals.fatTarget,
        };
        mealPlan = meals.mealPlan || [];
      } catch (mealErr) {
        console.error("Meal plan generation failed, using defaults:", mealErr);
        mealPlan = [];
      }

      rawAIResponse = { imported, mealPlan, macros };
    } else {
      const messages = buildFitnessPlanPrompt(
        profile as unknown as Record<string, unknown>
      );
      const aiPlan = await callJson<AIPlanResponse>(messages, {
        maxTokens: 8192,
        temperature: 0.7,
        userId: session.user.id,
        purpose: "plan_generate",
      });

      durationWeeks = aiPlan.durationWeeks || 12;
      macros = {
        dailyCalorieTarget: aiPlan.dailyCalorieTarget,
        dailyWaterTarget: aiPlan.dailyWaterTarget,
        proteinTarget: aiPlan.proteinTarget,
        carbTarget: aiPlan.carbTarget,
        fatTarget: aiPlan.fatTarget,
      };
      mealPlan = aiPlan.mealPlan || [];
      workoutDaysToCreate = ensureFullWeek(aiPlan.workoutPlan || []).map(
        (day) => ({ ...day, weekNumber: 1 })
      );
      rawAIResponse = aiPlan;
    }

    const fitnessPlan = await prisma.$transaction(async (tx) => {
      await tx.fitnessPlan.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false },
      });

      return tx.fitnessPlan.create({
        data: {
          userId: session.user.id,
          durationWeeks,
          dailyCalorieTarget: macros.dailyCalorieTarget,
          dailyWaterTarget: macros.dailyWaterTarget,
          proteinTarget: macros.proteinTarget,
          carbTarget: macros.carbTarget,
          fatTarget: macros.fatTarget,
          rawAIResponse: JSON.parse(JSON.stringify(rawAIResponse)),
          workoutDays: {
            create: workoutDaysToCreate.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              weekNumber: day.weekNumber,
              name: day.name,
              isRestDay: day.isRestDay,
              exercises:
                !day.isRestDay && day.exercises?.length
                  ? {
                      create: day.exercises.map((ex, idx) =>
                        normalizeExercise(ex, idx)
                      ),
                    }
                  : undefined,
            })),
          },
          mealPlans: {
            create: (mealPlan || []).flatMap((day) =>
              (day.meals || []).map((meal) => ({
                dayOfWeek: Number(day.dayOfWeek) || 1,
                mealType: normalizeMealType(meal.mealType),
                description: String(meal.description || ""),
                calories: Number(meal.calories) || 0,
                protein: Number(meal.protein) || 0,
                carbs: Number(meal.carbs) || 0,
                fat: Number(meal.fat) || 0,
              }))
            ),
          },
        },
        include: {
          workoutDays: { include: { exercises: true } },
          mealPlans: true,
        },
      });
    });

    return Response.json(fitnessPlan, { status: 201 });
  } catch (error) {
    if (error instanceof AiBudgetExceededError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
          displayUsed: error.displayUsed,
          displayLimit: error.displayLimit,
        },
        { status: 402 }
      );
    }
    console.error("Plan generation error:", error);
    return Response.json(
      { error: "Plan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
