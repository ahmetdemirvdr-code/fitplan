import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  const plan = await prisma.fitnessPlan.findFirst({
    where: { userId: user.id, isActive: true },
    include: {
      workoutDays: {
        include: { exercises: { orderBy: { order: "asc" } } },
        orderBy: [{ weekNumber: "asc" }, { dayOfWeek: "asc" }],
      },
      mealPlans: {
        orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
      },
    },
  });

  if (!plan) {
    return Response.json({ error: "Aktif plan bulunamadi" }, { status: 404 });
  }

  return Response.json(plan);
}
