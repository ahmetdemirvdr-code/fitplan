"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Moon,
  Trash2,
  Link2,
  Unlink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StepsPlatformNotice } from "@/components/steps-platform-notice";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ghConnected, setGhConnected] = useState(false);
  const [ghLastSync, setGhLastSync] = useState<string | null>(null);
  const [ghLoading, setGhLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadGh = useCallback(async () => {
    try {
      const res = await fetch("/api/google-health/disconnect");
      if (!res.ok) return;
      const data = await res.json();
      setGhConnected(!!data.connected);
      setGhLastSync(data.lastSyncAt || null);
    } catch {
      // ignore
    } finally {
      setGhLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGh();
  }, [loadGh]);

  useEffect(() => {
    const gh = searchParams.get("gh");
    if (!gh) return;
    if (gh === "connected") toast.success("Google Fit bağlandı");
    if (gh === "denied") toast.error("Google yetkilendirmesi iptal edildi");
    if (gh === "error") toast.error("Google bağlantısı başarısız");
    if (gh === "config") toast.error("Google Health ortam değişkenleri eksik");
    void loadGh();
    router.replace("/profile/settings");
  }, [searchParams, loadGh, router]);

  const disconnect = async () => {
    const res = await fetch("/api/google-health/disconnect", { method: "POST" });
    if (res.ok) {
      setGhConnected(false);
      setGhLastSync(null);
      toast.success("Bağlantı kesildi");
    } else {
      toast.error("Bağlantı kesilemedi");
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/google-health/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Senkron başarısız");
        return;
      }
      toast.success(
        data.steps
          ? `${data.steps.toLocaleString("tr-TR")} adım senkronlandı`
          : data.message || "Senkron tamam"
      );
      await loadGh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Ayarlar</h1>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-[#a29bfe]" />
                <div className="flex-1">
                  <Label className="font-semibold">Google Fit / Health</Label>
                  <p className="text-sm text-muted-foreground">
                    Adım verisini otomatik çek (Android / Google hesabı)
                  </p>
                </div>
              </div>

              <StepsPlatformNotice />

              {ghLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" />
              ) : ghConnected ? (
                <div className="space-y-2">
                  <p className="text-sm text-[#4ECDC4]">
                    Bağlı
                    {ghLastSync
                      ? ` · son senkron: ${new Date(ghLastSync).toLocaleString("tr-TR")}`
                      : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl bg-[#a29bfe] text-[#1A1A2E] hover:bg-[#8b7cf0]"
                      disabled={syncing}
                      onClick={() => void sync()}
                    >
                      {syncing ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1 h-4 w-4" />
                      )}
                      Şimdi senkronize et
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-[#E74C3C]/40 text-[#E74C3C]"
                      onClick={() => void disconnect()}
                    >
                      <Unlink className="mr-1 h-4 w-4" />
                      Bağlantıyı kes
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  className="w-full rounded-xl bg-[#FF6B35] hover:bg-[#E55A25]"
                  onClick={() => {
                    window.location.href = "/api/google-health/connect";
                  }}
                >
                  Google Fit Bağla
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="font-semibold">Bildirimler</Label>
                  <p className="text-sm text-muted-foreground">
                    Su, yemek ve antrenman hatırlatmalari
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Bildirim ayarlari yaklasimda...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="font-semibold">Tema</Label>
                  <p className="text-sm text-muted-foreground">
                    Acik / Koyu tema tercihi
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Tema ayarlari yaklasimda...
              </p>
            </CardContent>
          </Card>

          <Separator />

          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <Label className="font-semibold text-destructive">
                    Hesabi Sil
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tüm verilerin kalıcı olarak silinir
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Bu özellik yaklasimda...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
