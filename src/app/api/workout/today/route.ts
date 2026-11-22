import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  // Get today's day of week (1=Monday, 7=Sunday)
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  let dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday
  dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1=Monday, 7=Sunday

  const plan = await prisma.fitnessPlan.findFirst({
    where: { userId: session.user.id, isActive: true },
  });

  if (!plan) {
    return Response.json({ error: "Aktif plan bulunamadi" }, { status: 404 });
  }

  const workoutDay = await prisma.workoutDay.findFirst({
    where: {
      fitnessPlanId: plan.id,
      dayOfWeek,
      weekNumber: 1,
    },
    include: {
      exercises: { orderBy: { order: "asc" } },
    },
  });

  if (!workoutDay) {
    return Response.json({
      isRestDay: true,
      name: "Dinlenme Gunu",
      exercises: [],
    });
  }

  // Get today's workout log if exists
  const todayStart = new Date(date);
  todayStart.setHours(0, 0, 0, 0);

  const dailyLog = await prisma.dailyLog.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: todayStart,
      },
    },
    include: {
      workoutLogs: {
        where: { workoutDayId: workoutDay.id },
        include: { exerciseLogs: true },
      },
    },
  });

  return Response.json({
    ...workoutDay,
    workoutLog: dailyLog?.workoutLogs[0] || null,
  });
}
