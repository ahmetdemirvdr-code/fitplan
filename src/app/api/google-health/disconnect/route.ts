import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  await prisma.googleHealthToken.deleteMany({
    where: { userId: session.user.id },
  });

  return Response.json({ disconnected: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const token = await prisma.googleHealthToken.findUnique({
    where: { userId: session.user.id },
    select: { updatedAt: true, createdAt: true },
  });

  return Response.json({
    connected: !!token,
    lastSyncAt: token?.updatedAt || null,
    connectedAt: token?.createdAt || null,
  });
}
