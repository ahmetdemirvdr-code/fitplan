import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeGoogleCode,
  FIT_SCOPE,
  googleHealthConfigured,
} from "@/lib/google-health";

export async function GET(request: NextRequest) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const settingsUrl = new URL("/profile/settings", base);

  if (!googleHealthConfigured()) {
    settingsUrl.searchParams.set("gh", "config");
    return Response.redirect(settingsUrl);
  }

  const code = request.nextUrl.searchParams.get("code");
  const userId = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError || !code || !userId) {
    settingsUrl.searchParams.set("gh", "denied");
    return Response.redirect(settingsUrl);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.googleHealthToken.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        expiresAt,
        scope: tokens.scope || FIT_SCOPE,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt,
        scope: tokens.scope || FIT_SCOPE,
      },
    });

    settingsUrl.searchParams.set("gh", "connected");
    return Response.redirect(settingsUrl);
  } catch (err) {
    console.error("Google Health callback error:", err);
    settingsUrl.searchParams.set("gh", "error");
    return Response.redirect(settingsUrl);
  }
}
