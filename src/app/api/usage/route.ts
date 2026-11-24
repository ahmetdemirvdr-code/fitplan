import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { getUserAiUsageSummary } from "@/lib/ai-usage";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const summary = await getUserAiUsageSummary(user.id);
  return Response.json({
    callCount: summary.callCount,
    displayCostUsd: summary.displayCostUsd,
    displayLimitUsd: summary.displayLimitUsd,
    remainingDisplayUsd: summary.remainingDisplayUsd,
    limitReached: summary.limitReached,
    isPremium: summary.isPremium,
  });
}
