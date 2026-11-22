/**
 * Upserts the admin account from env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME (optional)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = (process.env.ADMIN_EMAIL || "admin@fitplan.app").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
const name = (process.env.ADMIN_NAME || "FitPlan Admin").trim();

if (!password || password.length < 8) {
  console.error(
    "==> ADMIN_PASSWORD missing or too short (min 8). Skipping admin seed."
  );
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 12);

const existing = await prisma.user.findUnique({ where: { email } });

if (existing) {
  await prisma.user.update({
    where: { id: existing.id },
    data: {
      name,
      passwordHash,
      role: "ADMIN",
      isPremium: true,
      premiumExpiresAt: null,
    },
  });
  console.log(`==> Admin updated: ${email}`);
} else {
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      isPremium: true,
      premiumExpiresAt: null,
      isEmailVerified: true,
    },
  });
  console.log(`==> Admin created: ${email}`);
}

await prisma.$disconnect();
