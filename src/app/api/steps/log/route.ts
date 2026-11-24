import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import { calculateStepCalories } from "@/lib/step-calories";

async function summarizeSteps(userId: string, date: Date) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { weight: true, height: true, dailyStepTarget: true },
  });

  const dailyLog = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId, date } },
    include: { stepLogs: { orderBy: { time: "asc" } } },
  });

  const logs = dailyLog?.stepLogs || [];
  const totalSteps = logs.reduce((s, l) => s + l.steps, 0);
  const distanceFromLogs = logs.reduce((s, l) => s + (l.distance || 0), 0);

  const weightKg = profile?.weight || 70;
  const heightCm = profile?.height || 170;
  const calc = calculateStepCalories({
    steps: totalSteps,
    weightKg,
    heightCm,
  });

  const distanceKm =
    distanceFromLogs > 0
      ? Math.round((distanceFromLogs / 1000) * 100) / 100
      : calc.distanceKm;

  const stepTarget = profile?.dailyStepTarget || 10000;
  const percentage =
    stepTarget > 0
      ? Math.min(100, Math.round((totalSteps / stepTarget) * 100))
      : 0;

  return {
    totalSteps,
    stepTarget,
    totalCalories: calc.calories,
    distanceKm,
    percentage,
    logs,
    met: calc.met,
  };
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      steps?: number;
      distance?: number;
      source?: "MANUAL" | "GOOGLE_HEALTH";
    };

    const steps = Number(body.steps);
    if (!Number.isFinite(steps) || steps < 1 || steps > 200_000) {
      return Response.json(
        { error: "Geçerli bir adım sayısı girin (1–200000)" },
        { status: 400 }
      );
    }

    const source =
      body.source === "GOOGLE_HEALTH" ? "GOOGLE_HEALTH" : "MANUAL";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: { userId: user.id, date: today },
      },
      create: { userId: user.id, date: today },
      update: {},
    });

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { weight: true, height: true },
    });

    const calc = calculateStepCalories({
      steps,
      weightKg: profile?.weight || 70,
      heightCm: profile?.height || 170,
    });

    const distanceM =
      typeof body.distance === "number" && body.distance > 0
        ? body.distance
        : calc.distanceKm * 1000;

    const stepLog = await prisma.stepLog.create({
      data: {
        dailyLogId: dailyLog.id,
        steps: Math.floor(steps),
        distance: distanceM,
        source,
      },
    });

    const summary = await summarizeSteps(user.id, today);

    return Response.json(
      {
        stepLog,
        ...summary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Step log error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const dateParam = request.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  const summary = await summarizeSteps(user.id, date);
  return Response.json(summary);
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const id =
      request.nextUrl.searchParams.get("id") ||
      ((await request.json().catch(() => null)) as { id?: string } | null)?.id;

    if (!id) {
      return Response.json({ error: "Kayıt kimliği gerekli" }, { status: 400 });
    }

    const stepLog = await prisma.stepLog.findUnique({
      where: { id },
      include: { dailyLog: true },
    });

    if (!stepLog || stepLog.dailyLog.userId !== user.id) {
      return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    await prisma.stepLog.delete({ where: { id } });

    const date = new Date(stepLog.dailyLog.date);
    date.setHours(0, 0, 0, 0);
    const summary = await summarizeSteps(user.id, date);

    return Response.json({ message: "Kayıt silindi", ...summary });
  } catch (error) {
    console.error("Step delete error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
