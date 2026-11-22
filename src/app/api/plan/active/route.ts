import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  const plan = await prisma.fitnessPlan.findFirst({
    where: { userId: session.user.id, isActive: true },
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
