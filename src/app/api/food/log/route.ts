import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import { foodLogSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = foodLogSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create daily log
    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: { userId: user.id, date: today },
      },
      create: { userId: user.id, date: today },
      update: {},
    });

    const foodLog = await prisma.foodLog.create({
      data: {
        dailyLogId: dailyLog.id,
        ...validated,
      },
    });

    return Response.json(foodLog, { status: 201 });
  } catch (error) {
    console.error("Food log error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  const dailyLog = await prisma.dailyLog.findUnique({
    where: {
      userId_date: { userId: user.id, date },
    },
    include: {
      foodLogs: { orderBy: { time: "asc" } },
    },
  });

  return Response.json({
    foodLogs: dailyLog?.foodLogs || [],
    totals: dailyLog?.foodLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ) || { calories: 0, protein: 0, carbs: 0, fat: 0 },
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  try {
    const id =
      request.nextUrl.searchParams.get("id") ||
      ((await request.json().catch(() => null)) as { id?: string } | null)?.id;

    if (!id) {
      return Response.json({ error: "Kayıt kimliği gerekli" }, { status: 400 });
    }

    const foodLog = await prisma.foodLog.findUnique({
      where: { id },
      include: { dailyLog: true },
    });

    if (!foodLog || foodLog.dailyLog.userId !== user.id) {
      return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    await prisma.foodLog.delete({ where: { id } });

    return Response.json({ message: "Kayıt silindi" });
  } catch (error) {
    console.error("Food delete error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
