import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  try {
    const { amount } = await request.json();
    if (!amount || typeof amount !== "number" || amount < 1) {
      return Response.json({ error: "Gecerli bir miktar girin" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: { userId: session.user.id, date: today },
      },
      create: { userId: session.user.id, date: today },
      update: {},
    });

    const waterLog = await prisma.waterLog.create({
      data: {
        dailyLogId: dailyLog.id,
        amount,
      },
    });

    return Response.json(waterLog, { status: 201 });
  } catch (error) {
    console.error("Water log error:", error);
    return Response.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  const dailyLog = await prisma.dailyLog.findUnique({
    where: {
      userId_date: { userId: session.user.id, date },
    },
    include: {
      waterLogs: { orderBy: { time: "asc" } },
    },
  });

  const totalMl = dailyLog?.waterLogs.reduce((sum, log) => sum + log.amount, 0) || 0;

  return Response.json({
    waterLogs: dailyLog?.waterLogs || [],
    totalMl,
    totalLiters: (totalMl / 1000).toFixed(1),
  });
}
