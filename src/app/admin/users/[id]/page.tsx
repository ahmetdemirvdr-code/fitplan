"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Crown,
  CalendarPlus,
  UserX,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type UserDetail = {
  id: string;
  email: string;
  name: string;
  role: string;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  membership: string;
  premiumActive: boolean;
  createdAt: string;
  displayAiCostUsd: number;
  profile: Record<string, unknown> | null;
  fitnessPlans: Array<{
    id: string;
    isActive: boolean;
    createdAt: string;
    durationWeeks: number;
    dailyCalorieTarget: number;
    dailyWaterTarget: number;
    _count: { workoutDays: number; mealPlans: number };
  }>;
  dailyLogs: Array<{
    id: string;
    date: string;
    weight: number | null;
    _count: { foodLogs: number; waterLogs: number; workoutLogs: number };
  }>;
  aiUsages: Array<{
    id: string;
    purpose: string;
    displayCostUsd: number;
    createdAt: string;
  }>;
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trialDays, setTrialDays] = useState("7");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/users/${id}`);
    if (!res.ok) {
      toast.error("Kullanıcı yüklenemedi");
      router.push("/admin/users");
      return;
    }
    setUser(await res.json());
  }, [id, router]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const patchMembership = async (
    action: "free" | "pro" | "extend_trial",
    days?: number
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/membership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, days }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "İşlem başarısız");
        return;
      }
      toast.success(`Üyelik güncellendi: ${data.membership}`);
      await load();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24 md:pb-0">
      <button
        type="button"
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-1 text-sm text-[#EAEAEA]/50 hover:text-[#EAEAEA]"
      >
        <ArrowLeft size={16} />
        Kullanıcılar
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-[#EAEAEA]/50">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              className={
                user.premiumActive
                  ? "bg-[#F1C40F]/20 text-[#F1C40F]"
                  : "bg-[#EAEAEA]/10"
              }
            >
              {user.membership}
            </Badge>
            {user.role === "ADMIN" && (
              <Badge className="bg-[#FF6B35]/20 text-[#FF6B35]">Admin</Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-[#EAEAEA]/40">
          Kayıt: {new Date(user.createdAt).toLocaleString("tr-TR")}
        </p>
      </div>

      {/* Membership controls */}
      {user.role !== "ADMIN" && (
        <Card className="border-[#F1C40F]/25 bg-[#1A1A2E]">
          <CardContent className="space-y-4 p-4">
            <h2 className="font-semibold">Üyelik yönetimi</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={saving}
                className="rounded-xl bg-[#F1C40F] font-semibold text-[#1A1A2E] hover:bg-[#d4ac0d]"
                onClick={() => patchMembership("pro")}
              >
                <Crown className="mr-2 h-4 w-4" />
                Pro yap (süresiz)
              </Button>
              <Button
                disabled={saving}
                variant="outline"
                className="rounded-xl"
                onClick={() => patchMembership("free")}
              >
                <UserX className="mr-2 h-4 w-4" />
                Ücretsize al
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="trial-days">Deneme uzat (gün)</Label>
                <Input
                  id="trial-days"
                  type="number"
                  min={1}
                  max={365}
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className="h-10 w-28 rounded-xl bg-[#16213E]"
                />
              </div>
              <Button
                disabled={saving}
                className="h-10 rounded-xl bg-[#4ECDC4] font-semibold text-[#1A1A2E] hover:bg-[#3DBDB4]"
                onClick={() =>
                  patchMembership("extend_trial", Number(trialDays) || 7)
                }
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Denemeyi uzat
              </Button>
            </div>
            {user.premiumExpiresAt && (
              <p className="text-xs text-[#EAEAEA]/50">
                Bitiş:{" "}
                {new Date(user.premiumExpiresAt).toLocaleString("tr-TR")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile */}
      <Card className="border-[#EAEAEA]/10 bg-[#1A1A2E]">
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold">Profil</h2>
          {!user.profile ? (
            <p className="text-sm text-[#EAEAEA]/50">Profil doldurulmamış</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {[
                ["Yaş", user.profile.age],
                ["Boy", `${user.profile.height} cm`],
                ["Kilo", `${user.profile.weight} kg`],
                ["Hedef", user.profile.goal],
                ["Seviye", user.profile.experienceLevel],
                ["Gün/hafta", user.profile.daysPerWeek],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-xl bg-[#16213E] p-2">
                  <p className="text-[10px] text-[#EAEAEA]/40">{k}</p>
                  <p className="font-medium">{String(v ?? "-")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <Card className="border-[#EAEAEA]/10 bg-[#1A1A2E]">
        <CardContent className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Dumbbell size={16} className="text-[#FF6B35]" />
            Planlar ({user.fitnessPlans.length})
          </h2>
          <div className="space-y-2">
            {user.fitnessPlans.map((p) => (
              <div
                key={p.id}
                className="rounded-xl bg-[#16213E] p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {p.durationWeeks} hafta · {p.dailyCalorieTarget} kcal
                  </span>
                  <Badge
                    className={
                      p.isActive
                        ? "bg-[#2ECC71]/20 text-[#2ECC71]"
                        : "bg-[#EAEAEA]/10 text-[#EAEAEA]/50"
                    }
                  >
                    {p.isActive ? "Aktif" : "Arşiv"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[#EAEAEA]/40">
                  {new Date(p.createdAt).toLocaleString("tr-TR")} ·{" "}
                  {p._count.workoutDays} antrenman günü · {p._count.mealPlans}{" "}
                  öğün
                </p>
              </div>
            ))}
            {user.fitnessPlans.length === 0 && (
              <p className="text-sm text-[#EAEAEA]/50">Plan yok</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily logs */}
      <Card className="border-[#EAEAEA]/10 bg-[#1A1A2E]">
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold">
            Son günlük kayıtlar ({user.dailyLogs.length})
          </h2>
          <div className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {user.dailyLogs.map((d) => (
              <div
                key={d.id}
                className="flex justify-between rounded-lg bg-[#16213E] px-3 py-2"
              >
                <span>
                  {new Date(d.date).toLocaleDateString("tr-TR")}
                  {d.weight != null ? ` · ${d.weight} kg` : ""}
                </span>
                <span className="text-xs text-[#EAEAEA]/40">
                  {d._count.workoutLogs} ant · {d._count.foodLogs} yemek ·{" "}
                  {d._count.waterLogs} su
                </span>
              </div>
            ))}
            {user.dailyLogs.length === 0 && (
              <p className="text-[#EAEAEA]/50">Kayıt yok</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI usage */}
      <Card className="border-[#EAEAEA]/10 bg-[#1A1A2E]">
        <CardContent className="p-4">
          <h2 className="mb-1 font-semibold">AI kullanımı</h2>
          <p className="mb-3 text-2xl font-bold text-[#4ECDC4]">
            ${user.displayAiCostUsd.toFixed(2)}
            <span className="text-sm font-normal text-[#EAEAEA]/40">
              {" "}
              (gösterilen)
            </span>
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto text-xs">
            {user.aiUsages.map((a) => (
              <div
                key={a.id}
                className="flex justify-between rounded-lg bg-[#16213E] px-3 py-2"
              >
                <span>{a.purpose}</span>
                <span>
                  ${a.displayCostUsd.toFixed(4)} ·{" "}
                  {new Date(a.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
