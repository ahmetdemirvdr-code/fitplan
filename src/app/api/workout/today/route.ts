import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanWeekNumber, resolvePhaseWeekNumber } from "@/lib/plan-week";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  let dayOfWeek = date.getDay();
  dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

  const plan = await prisma.fitnessPlan.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      workoutDays: { select: { weekNumber: true } },
    },
  });

  if (!plan) {
    return Response.json({ error: "Aktif plan bulunamadı" }, { status: 404 });
  }

  const planWeek = Math.min(
    getPlanWeekNumber(plan.createdAt, date),
    plan.durationWeeks || 12
  );
  const phaseWeek = resolvePhaseWeekNumber(
    plan.workoutDays.map((d) => d.weekNumber),
    planWeek
  );

  const workoutDay = await prisma.workoutDay.findFirst({
    where: {
      fitnessPlanId: plan.id,
      dayOfWeek,
      weekNumber: phaseWeek,
    },
    include: {
      exercises: { orderBy: { order: "asc" } },
    },
  });

  if (!workoutDay) {
    return Response.json({
      isRestDay: true,
      name: "Dinlenme Günü",
      exercises: [],
      planWeek,
      phaseWeek,
    });
  }

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
    planWeek,
    phaseWeek,
    workoutLog: dailyLog?.workoutLogs[0] || null,
  });
}
