import { auth } from "@/lib/auth";
import {
  getGoogleAuthUrl,
  googleHealthConfigured,
} from "@/lib/google-health";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
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

  const url = getGoogleAuthUrl(session.user.id);
  return Response.redirect(url);
}
