import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";

/** Reactivate the most recent inactive plan (keeps profile & history intact). */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const active = await prisma.fitnessPlan.findFirst({
    where: { userId: user.id, isActive: true },
  });
  if (active) {
    return Response.json(active);
  }

  const latest = await prisma.fitnessPlan.findFirst({
    where: { userId: user.id, isActive: false },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return Response.json({ error: "Geri yüklenecek plan bulunamadı" }, { status: 404 });
  }

  const restored = await prisma.$transaction(async (tx) => {
    await tx.fitnessPlan.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });
    return tx.fitnessPlan.update({
      where: { id: latest.id },
      data: { isActive: true },
      include: {
        workoutDays: { include: { exercises: true } },
        mealPlans: true,
      },
    });
  });

  return Response.json(restored);
}
