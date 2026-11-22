import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: Response.json({ error: "Yetkisiz erişim" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: Response.json({ error: "Admin yetkisi gerekli" }, { status: 403 }) };
  }

  return { admin: user };
}

export function isPremiumActive(user: {
  isPremium: boolean;
  premiumExpiresAt: Date | null;
}) {
  if (!user.isPremium) return false;
  if (!user.premiumExpiresAt) return true;
  return user.premiumExpiresAt.getTime() > Date.now();
}

export function membershipLabel(user: {
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  role?: string;
}) {
  if (user.role === "ADMIN") return "Admin";
  if (!user.isPremium) return "Ücretsiz";
  if (!user.premiumExpiresAt) return "Pro (süresiz)";
  if (user.premiumExpiresAt.getTime() > Date.now()) {
    return `Pro / Deneme · ${user.premiumExpiresAt.toLocaleDateString("tr-TR")}`;
  }
  return "Süresi dolmuş";
}
