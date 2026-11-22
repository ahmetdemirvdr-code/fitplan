import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { measurementSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = measurementSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: { userId: session.user.id, date: today },
      },
      create: {
        userId: session.user.id,
        date: today,
        weight: validated.weight ?? null,
        chestMeasure: validated.chestMeasure ?? null,
        waistMeasure: validated.waistMeasure ?? null,
        hipMeasure: validated.hipMeasure ?? null,
        armMeasure: validated.armMeasure ?? null,
        notes: validated.notes ?? null,
      },
      update: {
        weight: validated.weight ?? undefined,
        chestMeasure: validated.chestMeasure ?? undefined,
        waistMeasure: validated.waistMeasure ?? undefined,
        hipMeasure: validated.hipMeasure ?? undefined,
        armMeasure: validated.armMeasure ?? undefined,
        notes: validated.notes ?? undefined,
      },
    });

    return Response.json(dailyLog);
  } catch (error) {
    console.error("Measurement error:", error);
    return Response.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "month"; // week, month, all

  const now = new Date();
  let startDate: Date;

  switch (range) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate },
    },
    include: {
      foodLogs: true,
      waterLogs: true,
      workoutLogs: true,
    },
    orderBy: { date: "asc" },
  });

  // Calculate summaries
  const summaries = logs.map((log) => ({
    date: log.date,
    weight: log.weight,
    chestMeasure: log.chestMeasure,
    waistMeasure: log.waistMeasure,
    hipMeasure: log.hipMeasure,
    armMeasure: log.armMeasure,
    totalCalories: log.foodLogs.reduce((sum, f) => sum + f.calories, 0),
    totalProtein: log.foodLogs.reduce((sum, f) => sum + f.protein, 0),
    totalCarbs: log.foodLogs.reduce((sum, f) => sum + f.carbs, 0),
    totalFat: log.foodLogs.reduce((sum, f) => sum + f.fat, 0),
    totalWaterMl: log.waterLogs.reduce((sum, w) => sum + w.amount, 0),
    workoutsCompleted: log.workoutLogs.filter((w) => w.isCompleted).length,
  }));

  return Response.json(summaries);
}
