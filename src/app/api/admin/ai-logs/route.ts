import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AI_COST_DISPLAY_MULTIPLIER } from "@/lib/ai-usage";

const PLAN_PURPOSES = [
  "plan_generate",
  "plan_import_workout",
  "plan_import_meals",
] as const;

export async function GET(request: NextRequest) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { searchParams } = request.nextUrl;
  const purpose = searchParams.get("purpose");
  const userId = searchParams.get("userId");
  const take = Math.min(100, Math.max(1, Number(searchParams.get("take")) || 40));

  const where = {
    ...(userId ? { userId } : {}),
    ...(purpose
      ? { purpose }
      : { purpose: { in: [...PLAN_PURPOSES] } }),
  };

  const logs = await prisma.aiUsage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      purpose: true,
      model: true,
      promptTokens: true,
      completionTokens: true,
      costUsd: true,
      requestMessages: true,
      responseContent: true,
      createdAt: true,
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return Response.json({
    logs: logs.map((log) => ({
      ...log,
      displayCostUsd: log.costUsd * AI_COST_DISPLAY_MULTIPLIER,
    })),
  });
}
