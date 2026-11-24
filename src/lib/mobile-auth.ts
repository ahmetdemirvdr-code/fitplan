import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export type MobileTokenPayload = {
  sub: string;
  email: string;
  name: string;
  hasProfile: boolean;
  role: "USER" | "ADMIN";
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  hasProfile: boolean;
  role: "USER" | "ADMIN";
};

const TOKEN_TTL = "30d";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  return secret;
}

export function signMobileToken(user: SessionUser): string {
  const payload: MobileTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    hasProfile: user.hasProfile,
    role: user.role,
  };
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL });
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as MobileTokenPayload;
  } catch {
    return null;
  }
}

export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function getMobileUser(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const payload = verifyMobileToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { profile: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    hasProfile: !!user.profile,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
  };
}
