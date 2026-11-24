import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import { calculateStepCalories } from "@/lib/step-calories";
import {
  fetchTodaySteps,
  googleHealthConfigured,
  refreshGoogleAccessToken,
} from "@/lib/google-health";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  if (!googleHealthConfigured()) {
    return Response.json(
      { error: "Google Health yapılandırılmamış", configured: false },
      { status: 503 }
    );
  }

  const stored = await prisma.googleHealthToken.findUnique({
    where: { userId: user.id },
  });

  if (!stored) {
    return Response.json(
      { error: "Google Health bağlı değil" },
      { status: 400 }
    );
  }

  try {
    let accessToken = stored.accessToken;

    if (stored.expiresAt.getTime() < Date.now() + 60_000) {
      if (!stored.refreshToken) {
        return Response.json(
          { error: "Oturum süresi dolmuş, yeniden bağlanın" },
          { status: 401 }
        );
      }
      const refreshed = await refreshGoogleAccessToken(stored.refreshToken);
      accessToken = refreshed.access_token;
      await prisma.googleHealthToken.update({
        where: { userId: user.id },
        data: {
          accessToken,
          expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
    }

    const steps = await fetchTodaySteps(accessToken);
    if (steps < 1) {
      return Response.json({
        synced: true,
        steps: 0,
        source: "GOOGLE_HEALTH",
        message: "Bugün için adım bulunamadı",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: { userId: user.id, date: today },
      },
      create: { userId: user.id, date: today },
      update: {},
      include: { stepLogs: true },
    });

    // Replace prior Google Health entries for today (keep MANUAL)
    const googleLogs = dailyLog.stepLogs.filter(
      (l) => l.source === "GOOGLE_HEALTH"
    );
    if (googleLogs.length) {
      await prisma.stepLog.deleteMany({
        where: { id: { in: googleLogs.map((l) => l.id) } },
      });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { weight: true, height: true },
    });

    const calc = calculateStepCalories({
      steps,
      weightKg: profile?.weight || 70,
      heightCm: profile?.height || 170,
    });

    await prisma.stepLog.create({
      data: {
        dailyLogId: dailyLog.id,
        steps,
        distance: calc.distanceKm * 1000,
        source: "GOOGLE_HEALTH",
      },
    });

    await prisma.googleHealthToken.update({
      where: { userId: user.id },
      data: { updatedAt: new Date() },
    });

    return Response.json({
      synced: true,
      steps,
      calories: calc.calories,
      distanceKm: calc.distanceKm,
      source: "GOOGLE_HEALTH",
    });
  } catch (error) {
    console.error("Google Health sync error:", error);
    return Response.json(
      { error: "Senkronizasyon başarısız" },
      { status: 500 }
    );
  }
}
