import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, membershipLabel, isPremiumActive } from "@/lib/admin";

type Action = "free" | "pro" | "extend_trial";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: Action;
    days?: number;
  };

  const action = body.action;
  if (!action || !["free", "pro", "extend_trial"].includes(action)) {
    return Response.json(
      { error: "Geçersiz işlem. free | pro | extend_trial" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return Response.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }
  if (user.role === "ADMIN") {
    return Response.json(
      { error: "Admin hesabının üyeliği buradan değiştirilemez" },
      { status: 400 }
    );
  }

  let data: { isPremium: boolean; premiumExpiresAt: Date | null };

  if (action === "free") {
    data = { isPremium: false, premiumExpiresAt: null };
  } else if (action === "pro") {
    data = { isPremium: true, premiumExpiresAt: null };
  } else {
    const days = Math.min(365, Math.max(1, Number(body.days) || 7));
    const base =
      user.premiumExpiresAt && user.premiumExpiresAt.getTime() > Date.now()
        ? new Date(user.premiumExpiresAt)
        : new Date();
    base.setDate(base.getDate() + days);
    data = { isPremium: true, premiumExpiresAt: base };
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isPremium: true,
      premiumExpiresAt: true,
    },
  });

  return Response.json({
    ...updated,
    membership: membershipLabel(updated),
    premiumActive: isPremiumActive(updated),
  });
}
