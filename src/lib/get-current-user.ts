import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getMobileUser, type SessionUser } from "@/lib/mobile-auth";

/**
 * Dual auth: NextAuth cookie session (web) or Bearer JWT (mobile).
 */
export async function getCurrentUser(
  request?: NextRequest
): Promise<SessionUser | null> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.name || "",
      hasProfile: !!session.user.hasProfile,
      role: session.user.role === "ADMIN" ? "ADMIN" : "USER",
    };
  }

  if (request) {
    return getMobileUser(request);
  }

  return null;
}
