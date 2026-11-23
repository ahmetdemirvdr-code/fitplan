import { prisma } from "@/lib/prisma";

/** Display multiplier for users (real cost × this). */
export const AI_COST_DISPLAY_MULTIPLIER = 10;

/** Free-tier real OpenRouter budget (USD). Displayed as ×10 → $10. */
export const FREE_AI_LIMIT_REAL_USD = 1;
export const FREE_AI_LIMIT_DISPLAY_USD =
  FREE_AI_LIMIT_REAL_USD * AI_COST_DISPLAY_MULTIPLIER;

export class AiBudgetExceededError extends Error {
  readonly code = "AI_BUDGET_EXCEEDED";
  readonly displayLimit: number;
  readonly displayUsed: number;

  constructor(displayUsed: number, displayLimit: number) {
    super(
      `Ücretsiz yapay zeka limitin doldu ($${displayUsed.toFixed(2)} / $${displayLimit.toFixed(2)}).`
    );
    this.name = "AiBudgetExceededError";
    this.displayUsed = displayUsed;
    this.displayLimit = displayLimit;
  }
}

const MAX_RESPONSE_CHARS = 100_000;

export async function recordAiUsage(input: {
  userId?: string | null;
  purpose: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  requestMessages?: unknown;
  responseContent?: string | null;
}) {
  try {
    const responseContent =
      input.responseContent == null
        ? null
        : input.responseContent.length > MAX_RESPONSE_CHARS
          ? `${input.responseContent.slice(0, MAX_RESPONSE_CHARS)}\n…[truncated]`
          : input.responseContent;

    await prisma.aiUsage.create({
      data: {
        userId: input.userId || null,
        purpose: input.purpose,
        model: input.model,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        costUsd: input.costUsd,
        requestMessages:
          input.requestMessages === undefined
            ? undefined
            : (JSON.parse(JSON.stringify(input.requestMessages)) as object),
        responseContent,
      },
    });
  } catch (err) {
    console.error("AiUsage record failed:", err);
  }
}

export async function getUserAiUsageSummary(userId: string) {
  const [agg, user] = await Promise.all([
    prisma.aiUsage.aggregate({
      where: { userId },
      _sum: { costUsd: true, promptTokens: true, completionTokens: true },
      _count: { _all: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumExpiresAt: true, role: true },
    }),
  ]);

  const realCostUsd = agg._sum.costUsd ?? 0;
  const displayCostUsd = realCostUsd * AI_COST_DISPLAY_MULTIPLIER;
  const isPremium =
    user?.role === "ADMIN" ||
    (!!user?.isPremium &&
      (!user.premiumExpiresAt ||
        user.premiumExpiresAt.getTime() > Date.now()));
  const displayLimitUsd = isPremium ? null : FREE_AI_LIMIT_DISPLAY_USD;
  const realLimitUsd = isPremium ? null : FREE_AI_LIMIT_REAL_USD;
  const remainingDisplayUsd =
    displayLimitUsd == null
      ? null
      : Math.max(0, displayLimitUsd - displayCostUsd);
  const limitReached =
    !isPremium && realCostUsd >= FREE_AI_LIMIT_REAL_USD - 1e-9;

  return {
    callCount: agg._count._all,
    promptTokens: agg._sum.promptTokens ?? 0,
    completionTokens: agg._sum.completionTokens ?? 0,
    realCostUsd,
    displayCostUsd,
    isPremium,
    displayLimitUsd,
    realLimitUsd,
    remainingDisplayUsd,
    limitReached,
  };
}

/** Throws AiBudgetExceededError if free user is over the real $1 / display $10 cap. */
export async function assertAiBudgetAllowed(userId: string | null | undefined) {
  if (!userId) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumExpiresAt: true, role: true },
  });
  if (user?.role === "ADMIN") return;
  if (user?.isPremium) {
    if (!user.premiumExpiresAt || user.premiumExpiresAt.getTime() > Date.now()) {
      return;
    }
  }

  const agg = await prisma.aiUsage.aggregate({
    where: { userId },
    _sum: { costUsd: true },
  });
  const realCostUsd = agg._sum.costUsd ?? 0;
  if (realCostUsd >= FREE_AI_LIMIT_REAL_USD - 1e-9) {
    throw new AiBudgetExceededError(
      realCostUsd * AI_COST_DISPLAY_MULTIPLIER,
      FREE_AI_LIMIT_DISPLAY_USD
    );
  }
}
