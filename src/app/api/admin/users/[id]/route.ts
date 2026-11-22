import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, membershipLabel, isPremiumActive } from "@/lib/admin";
import { AI_COST_DISPLAY_MULTIPLIER } from "@/lib/ai-usage";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { id } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      fitnessPlans: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          isActive: true,
          createdAt: true,
          durationWeeks: true,
          dailyCalorieTarget: true,
          dailyWaterTarget: true,
          _count: { select: { workoutDays: true, mealPlans: true } },
        },
      },
      dailyLogs: {
        orderBy: { date: "desc" },
        take: 30,
        select: {
          id: true,
          date: true,
          weight: true,
          _count: {
            select: { foodLogs: true, waterLogs: true, workoutLogs: true },
          },
        },
      },
      aiUsages: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          purpose: true,
          model: true,
          costUsd: true,
          promptTokens: true,
          completionTokens: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return Response.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const realCost = user.aiUsages.reduce((s, a) => s + a.costUsd, 0);

  return Response.json({
    ...user,
    membership: membershipLabel(user),
    premiumActive: isPremiumActive(user),
    displayAiCostUsd: realCost * AI_COST_DISPLAY_MULTIPLIER,
    aiUsages: user.aiUsages.map((a) => ({
      ...a,
      displayCostUsd: a.costUsd * AI_COST_DISPLAY_MULTIPLIER,
    })),
  });
}
