import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkişiz erişim" }, { status: 401 });
  }

  try {
    const { amount } = await request.json();
    if (!amount || typeof amount !== "number" || amount < 1) {
      return Response.json({ error: "Geçerli bir miktar girin" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: { userId: user.id, date: today },
      },
      create: { userId: user.id, date: today },
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

    const waterLog = await prisma.waterLog.findUnique({
      where: { id },
      include: { dailyLog: true },
    });

    if (!waterLog || waterLog.dailyLog.userId !== user.id) {
      return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    await prisma.waterLog.delete({ where: { id } });

    return Response.json({ message: "Kayıt silindi" });
  } catch (error) {
    console.error("Water delete error:", error);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
