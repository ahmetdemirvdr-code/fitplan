import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  callOpenRouterDetailed,
  buildStepTargetPrompt,
} from "@/lib/openrouter";
import { AiBudgetExceededError } from "@/lib/ai-usage";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return Response.json({ error: "Profil bulunamadı" }, { status: 404 });
    }

    const messages = buildStepTargetPrompt({
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      goal: profile.goal,
      experienceLevel: profile.experienceLevel,
      minutesPerDay: profile.minutesPerDay,
    });

    const result = await callOpenRouterDetailed(messages, {
      maxTokens: 256,
      temperature: 0.4,
      userId: session.user.id,
      purpose: "step_target",
    });

    let suggestedTarget = 10000;
    let reason = "Genel sağlıklı yetişkin hedefi";

    try {
      const parsed = JSON.parse(result.content) as {
        target?: number;
        reason?: string;
      };
      if (typeof parsed.target === "number") {
        suggestedTarget = Math.min(
          15000,
          Math.max(5000, Math.round(parsed.target))
        );
      }
      if (parsed.reason) reason = String(parsed.reason);
    } catch {
      // keep defaults
    }

    return Response.json({ suggestedTarget, reason });
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
    console.error("AI step target error:", error);
    return Response.json({ error: "Öneri oluşturulamadı" }, { status: 500 });
  }
}
