import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }
  return Response.json({ user });
}
