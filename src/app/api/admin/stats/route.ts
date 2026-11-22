import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AI_COST_DISPLAY_MULTIPLIER } from "@/lib/ai-usage";

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const [userCount, premiumCount, planCount, aiAgg] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({
      where: {
        role: "USER",
        isPremium: true,
        OR: [
          { premiumExpiresAt: null },
          { premiumExpiresAt: { gt: new Date() } },
        ],
      },
    }),
    prisma.fitnessPlan.count({ where: { isActive: true } }),
    prisma.aiUsage.aggregate({ _sum: { costUsd: true }, _count: true }),
  ]);

  return Response.json({
    userCount,
    premiumCount,
    freeCount: Math.max(0, userCount - premiumCount),
    activePlans: planCount,
    aiCalls: aiAgg._count,
    displayAiCostUsd:
      (aiAgg._sum.costUsd ?? 0) * AI_COST_DISPLAY_MULTIPLIER,
  });
}
