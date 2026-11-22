import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { workoutDayId, exerciseLogs } = body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create daily log
    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: { userId: session.user.id, date: today },
      },
      create: { userId: session.user.id, date: today },
      update: {},
    });

    // Create workout log
    const workoutLog = await prisma.workoutLog.create({
      data: {
        dailyLogId: dailyLog.id,
        workoutDayId,
        isCompleted: true,
        completedAt: new Date(),
        exerciseLogs: exerciseLogs
          ? {
              create: exerciseLogs.map(
                (log: { exerciseId: string; setNumber: number; reps: number; weight?: number; isCompleted: boolean }) => ({
                  exerciseId: log.exerciseId,
                  setNumber: log.setNumber,
                  reps: log.reps,
                  weight: log.weight || null,
                  isCompleted: log.isCompleted,
                })
              ),
            }
          : undefined,
      },
      include: { exerciseLogs: true },
    });

    return Response.json(workoutLog, { status: 201 });
  } catch (error) {
    console.error("Workout log error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
