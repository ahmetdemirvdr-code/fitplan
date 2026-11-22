import { prisma } from "@/lib/prisma";
import { requireAdmin, membershipLabel, isPremiumActive } from "@/lib/admin";
import { AI_COST_DISPLAY_MULTIPLIER } from "@/lib/ai-usage";

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isPremium: true,
      premiumExpiresAt: true,
      createdAt: true,
      profile: { select: { age: true, goal: true, weight: true } },
      _count: {
        select: {
          fitnessPlans: true,
          dailyLogs: true,
          aiUsages: true,
        },
      },
      aiUsages: {
        select: { costUsd: true },
      },
    },
  });

  return Response.json(
    users.map((u) => {
      const realCost = u.aiUsages.reduce((s, a) => s + a.costUsd, 0);
      const { aiUsages: _a, ...rest } = u;
      return {
        ...rest,
        membership: membershipLabel(u),
        premiumActive: isPremiumActive(u),
        displayAiCostUsd: realCost * AI_COST_DISPLAY_MULTIPLIER,
      };
    })
  );
}
