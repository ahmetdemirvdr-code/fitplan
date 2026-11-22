"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Crown, Dumbbell, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

type Stats = {
  userCount: number;
  premiumCount: number;
  freeCount: number;
  activePlans: number;
  aiCalls: number;
  displayAiCostUsd: number;
};

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  const cards = [
    {
      label: "Kullanıcı",
      value: stats?.userCount ?? 0,
      icon: Users,
      color: "#4ECDC4",
    },
    {
      label: "Pro / Deneme",
      value: stats?.premiumCount ?? 0,
      icon: Crown,
      color: "#F1C40F",
    },
    {
      label: "Aktif plan",
      value: stats?.activePlans ?? 0,
      icon: Dumbbell,
      color: "#FF6B35",
    },
    {
      label: "AI harcama (gösterilen)",
      value: `$${(stats?.displayAiCostUsd ?? 0).toFixed(2)}`,
      icon: Bot,
      color: "#a29bfe",
      sub: `${stats?.aiCalls ?? 0} çağrı`,
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Yönetim Özeti</h1>
        <p className="text-sm text-[#EAEAEA]/50">
          Kullanıcıları ve üyelikleri yönet
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="border-[#EAEAEA]/10 bg-[#1A1A2E]">
              <CardContent className="p-4">
                <Icon className="mb-2 h-5 w-5" style={{ color: c.color }} />
                <p className="text-2xl font-bold tabular-nums">{c.value}</p>
                <p className="text-xs text-[#EAEAEA]/50">{c.label}</p>
                {c.sub && (
                  <p className="mt-1 text-[10px] text-[#EAEAEA]/40">{c.sub}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Link
        href="/admin/users"
        className="inline-flex rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E55A25]"
      >
        Kullanıcı listesine git
      </Link>
    </div>
  );
}
