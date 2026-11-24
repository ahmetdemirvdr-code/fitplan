import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  getGoogleAuthUrl,
  googleHealthConfigured,
} from "@/lib/google-health";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user?.id) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  if (!googleHealthConfigured()) {
    return Response.json(
      {
        error:
          "Google Health yapılandırılmamış. GOOGLE_HEALTH_* ortam değişkenlerini ekleyin.",
        configured: false,
      },
      { status: 503 }
    );
  }

  const url = getGoogleAuthUrl(user.id);
  return Response.redirect(url);
}
