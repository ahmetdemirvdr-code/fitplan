"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  Dumbbell,
  Loader2,
  RefreshCw,
  Crown,
  ClipboardPaste,
  Sparkles,
  X,
  Bot,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { PlanGeneratingStatus } from "@/components/plan-generating-status";

interface ProfileData {
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
  experienceLevel: string;
  daysPerWeek: number;
}

interface PlanData {
  id: string;
  createdAt: string;
  durationWeeks: number;
  dailyCalorieTarget: number;
}

const goalLabels: Record<string, string> = {
  LOSE_WEIGHT: "Kilo Verme",
  BUILD_MUSCLE: "Kas Yapma",
  MAINTAIN: "Form Koruma",
  ENDURANCE: "Dayanıklılık",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "Başlangıç",
  INTERMEDIATE: "Orta",
  ADVANCED: "İleri",
};

type UpdateMode = null | "choose" | "import";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [updateMode, setUpdateMode] = useState<UpdateMode>(null);
  const [existingProgram, setExistingProgram] = useState("");
  const [aiSpendDisplay, setAiSpendDisplay] = useState(0);
  const [aiSpendLimit, setAiSpendLimit] = useState<number | null>(10);
  const [aiLimitReached, setAiLimitReached] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, planRes, usageRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/plan/active"),
        fetch("/api/usage"),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (planRes.ok) setPlan(await planRes.json());
      if (usageRes.ok) {
        const usage = await usageRes.json();
        setAiSpendDisplay(Number(usage.displayCostUsd) || 0);
        setAiSpendLimit(
          usage.isPremium ? null : Number(usage.displayLimitUsd) || 10
        );
        setAiLimitReached(!!usage.limitReached);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const regeneratePlan = async (programText?: string) => {
    setRegenerating(true);
    toast.info(
      programText
        ? "Programın FitPlan formatına dönüştürülüyor..."
        : "Plan yeniden oluşturuluyor..."
    );

    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          programText ? { existingProgram: programText } : {}
        ),
      });
      if (res.ok) {
        toast.success("Yeni plan oluşturuldu!");
        setUpdateMode(null);
        setExistingProgram("");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Plan oluşturulamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setRegenerating(false);
    }
  };

  const handleImportSubmit = async () => {
    const text = existingProgram.trim();
    if (text.length < 40) {
      toast.error("Lütfen programını biraz daha detaylı yapıştır");
      return;
    }
    await regeneratePlan(text);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* User Info */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#FF6B35]/20">
            <User className="h-10 w-10 text-[#FF6B35]" />
          </div>
          <h1 className="text-xl font-bold">{session?.user?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {session?.user?.email}
          </p>
          <Badge variant="secondary" className="mt-2">
            <Crown className="mr-1 h-3 w-3" />
            Ücretsiz Plan
          </Badge>
        </div>

        {/* Profile Stats */}
        {profile && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="mb-3 font-semibold">Profilim</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Yaş:</span>{" "}
                  <span className="font-medium">{profile.age}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Boy:</span>{" "}
                  <span className="font-medium">{profile.height} cm</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Kilo:</span>{" "}
                  <span className="font-medium">{profile.weight} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hedef:</span>{" "}
                  <span className="font-medium">
                    {goalLabels[profile.goal]}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Seviye:</span>{" "}
                  <span className="font-medium">
                    {levelLabels[profile.experienceLevel]}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gün/Hafta:</span>{" "}
                  <span className="font-medium">{profile.daysPerWeek}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Plan */}
        {plan && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Aktif Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(plan.createdAt).toLocaleDateString("tr-TR")} tarihinde
                    oluşturuldu
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.durationWeeks} haftalık - {plan.dailyCalorieTarget}{" "}
                    kcal/gün
                  </p>
                </div>
                <Dumbbell className="h-8 w-8 text-[#FF6B35]" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI usage (display = real × 10; free limit $10 display = $1 real) */}
        <Card
          className={`mb-4 ${
            aiLimitReached ? "border-[#E74C3C]/40" : "border-[#4ECDC4]/20"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">Yapay Zeka Kullanımı</h3>
                <p
                  className={`mt-1 text-2xl font-bold tabular-nums ${
                    aiLimitReached ? "text-[#E74C3C]" : "text-[#4ECDC4]"
                  }`}
                >
                  ${aiSpendDisplay.toFixed(2)}
                  {aiSpendLimit != null && (
                    <span className="text-base font-medium text-muted-foreground">
                      {" "}
                      / ${aiSpendLimit.toFixed(2)}
                    </span>
                  )}
                </p>
                {aiSpendLimit != null && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#16213E]">
                    <div
                      className={`h-full rounded-full ${
                        aiLimitReached ? "bg-[#E74C3C]" : "bg-[#4ECDC4]"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (aiSpendDisplay / aiSpendLimit) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {aiLimitReached
                    ? "Ücretsiz AI limitin doldu. Yeni plan / AI özellikler durdu."
                    : aiSpendLimit != null
                      ? `Ücretsiz limit: $${aiSpendLimit.toFixed(0)}. Kalan: $${Math.max(0, aiSpendLimit - aiSpendDisplay).toFixed(2)}`
                      : "Premium — limitsiz AI kullanımı"}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  aiLimitReached
                    ? "bg-[#E74C3C]/15 text-[#E74C3C]"
                    : "bg-[#4ECDC4]/15 text-[#4ECDC4]"
                }`}
              >
                <Bot className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-12 justify-between rounded-xl"
            onClick={() => setUpdateMode("choose")}
            disabled={regenerating}
          >
            <div className="flex items-center gap-2">
              <RefreshCw
                className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
              />
              <span>Planımı Güncelle</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Link href="/profile/settings">
            <Button
              variant="outline"
              className="w-full h-12 justify-between rounded-xl"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Ayarlar</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>

          <Separator className="my-4" />

          <Button
            variant="ghost"
            className="w-full h-12 justify-start rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </div>

      {/* Update plan sheet */}
      {updateMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[#EAEAEA]/10 bg-[#1A1A2E] p-5 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#EAEAEA]">
                {updateMode === "import" ? "Programı yapıştır" : "Planı nasıl güncelleyelim?"}
              </h2>
              <button
                type="button"
                className="rounded-lg p-2 text-[#EAEAEA]/50 hover:bg-[#EAEAEA]/10 hover:text-[#EAEAEA]"
                onClick={() => {
                  if (regenerating) return;
                  setUpdateMode(null);
                  setExistingProgram("");
                }}
                disabled={regenerating}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {regenerating ? (
              <PlanGeneratingStatus
                compact
                title="Planın hazırlanıyor"
                detail={
                  updateMode === "import"
                    ? "Programın FitPlan formatına dönüştürülüyor..."
                    : "Profiline göre yeni plan üretiliyor..."
                }
              />
            ) : updateMode === "choose" ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => regeneratePlan()}
                  className="flex w-full items-start gap-4 rounded-2xl border border-[#FF6B35]/30 bg-[#FF6B35]/10 p-4 text-left transition hover:bg-[#FF6B35]/15"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/20 text-[#FF6B35]">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#EAEAEA]">
                      Profilime göre yeniden oluştur
                    </p>
                    <p className="mt-1 text-sm text-[#EAEAEA]/50">
                      Mevcut profil bilgilerinle AI yeni bir plan üretsin.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUpdateMode("import")}
                  className="flex w-full items-start gap-4 rounded-2xl border border-[#4ECDC4]/30 bg-[#4ECDC4]/10 p-4 text-left transition hover:bg-[#4ECDC4]/15"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4ECDC4]/20 text-[#4ECDC4]">
                    <ClipboardPaste size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#EAEAEA]">
                      Kendi programımı yapıştır
                    </p>
                    <p className="mt-1 text-sm text-[#EAEAEA]/50">
                      Elindeki antrenman programını yapıştır; AI buna göre güncellesin.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm(
                      "Soru-cevap testine gideceksin.\n\nTesti bitirmeden çıkarsan mevcut profilin ve planın silinmez — hiçbir şey kaybolmaz.\n\nDevam edilsin mi?"
                    );
                    if (ok) router.push("/onboarding?retake=1");
                  }}
                  className="flex w-full items-start gap-4 rounded-2xl border border-[#EAEAEA]/15 bg-[#16213E] p-4 text-left transition hover:bg-[#1f2b4a]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#EAEAEA]">
                      Soru-cevap testini yeniden yap
                    </p>
                    <p className="mt-1 text-sm text-[#EAEAEA]/50">
                      7 adımlık testi tekrar doldur. Bitirmeden çıkarsan mevcut verilerin korunur.
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="update-program">Mevcut antrenman programın</Label>
                  <Textarea
                    id="update-program"
                    value={existingProgram}
                    onChange={(e) => setExistingProgram(e.target.value)}
                    placeholder={`Örnek:\nPazartesi - Göğüs\nBench Press 4x8-10\nIncline DB Press 3x10\n...\nÇarşamba - Sırt\nPull-up 4x8\n...`}
                    className="min-h-[200px] rounded-xl bg-[#16213E] text-sm"
                  />
                  <p className="text-xs text-[#EAEAEA]/40">
                    Günler, hareketler, set/tekrar yeterli. AI FitPlan formatına çevirir.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="h-11 flex-1 rounded-xl"
                    onClick={() => setUpdateMode("choose")}
                  >
                    Geri
                  </Button>
                  <Button
                    className="h-11 flex-1 rounded-xl bg-[#4ECDC4] font-semibold text-[#1A1A2E] hover:bg-[#3DBDB4]"
                    onClick={handleImportSubmit}
                  >
                    Programdan Güncelle
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
