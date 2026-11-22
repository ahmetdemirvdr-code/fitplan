import { auth } from "@/lib/auth";
import { getUserAiUsageSummary } from "@/lib/ai-usage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const summary = await getUserAiUsageSummary(session.user.id);
  return Response.json({
    callCount: summary.callCount,
    displayCostUsd: summary.displayCostUsd,
    displayLimitUsd: summary.displayLimitUsd,
    remainingDisplayUsd: summary.remainingDisplayUsd,
    limitReached: summary.limitReached,
    isPremium: summary.isPremium,
  });
}
