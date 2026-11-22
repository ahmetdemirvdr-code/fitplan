import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, buildFitnessPlanPrompt } from "@/lib/openrouter";

interface AIExercise {
  name: string;
  nameEn: string;
  sets: number;
  reps: string;
  weight?: string;
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
  workoutPlan: AIWorkoutDay[];
  mealPlan: AIMealDay[];
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  try {
    // Get user profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return Response.json(
        { error: "Once profilinizi olusturun" },
        { status: 400 }
      );
    }

    // Deactivate existing plans
    await prisma.fitnessPlan.updateMany({
      where: { userId: session.user.id, isActive: true },
      data: { isActive: false },
    });

    // Build prompt and call AI
    const messages = buildFitnessPlanPrompt(profile as unknown as Record<string, unknown>);
    const aiResponseText = await callOpenRouter(messages, {
      maxTokens: 8192,
      temperature: 0.7,
    });

    // Parse AI response
    let aiPlan: AIPlanResponse;
    try {
      aiPlan = JSON.parse(aiResponseText);
    } catch {
      // Retry once if JSON parse fails
      const retryResponse = await callOpenRouter(messages, {
        maxTokens: 8192,
        temperature: 0.5,
      });
      aiPlan = JSON.parse(retryResponse);
    }

    // Save plan to database
    const fitnessPlan = await prisma.fitnessPlan.create({
      data: {
        userId: session.user.id,
        dailyCalorieTarget: aiPlan.dailyCalorieTarget,
        dailyWaterTarget: aiPlan.dailyWaterTarget,
        proteinTarget: aiPlan.proteinTarget,
        carbTarget: aiPlan.carbTarget,
        fatTarget: aiPlan.fatTarget,
        rawAIResponse: JSON.parse(JSON.stringify(aiPlan)),
        workoutDays: {
          create: aiPlan.workoutPlan.map((day: AIWorkoutDay) => ({
            dayOfWeek: day.dayOfWeek,
            weekNumber: 1,
            name: day.name,
            isRestDay: day.isRestDay,
            exercises: day.exercises
              ? {
                  create: day.exercises.map(
                    (ex: AIExercise, idx: number) => ({
                      name: ex.name,
                      nameEn: ex.nameEn,
                      sets: ex.sets,
                      reps: ex.reps,
                      weight: ex.weight || null,
                      restSeconds: ex.restSeconds || 60,
                      order: idx + 1,
                      description: ex.description,
                    })
                  ),
                }
              : undefined,
          })),
        },
        mealPlans: {
          create: aiPlan.mealPlan.flatMap((day: AIMealDay) =>
            day.meals.map((meal: AIMeal) => ({
              dayOfWeek: day.dayOfWeek,
              mealType: meal.mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
              description: meal.description,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
            }))
          ),
        },
      },
      include: {
        workoutDays: { include: { exercises: true } },
        mealPlans: true,
      },
    });

    return Response.json(fitnessPlan, { status: 201 });
  } catch (error) {
    console.error("Plan generation error:", error);
    return Response.json(
      { error: "Plan olusturulurken bir hata olustu. Lutfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
