"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  membership: string;
  premiumActive: boolean;
  createdAt: string;
  displayAiCostUsd: number;
  _count: { fitnessPlans: number; dailyLogs: number; aiUsages: number };
  profile: { age: number; goal: string; weight: number } | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(s) ||
        u.name.toLowerCase().includes(s) ||
        u.membership.toLowerCase().includes(s)
    );
  }, [users, q]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <p className="text-sm text-[#EAEAEA]/50">
          {users.length} kayıt · tıklayarak detay ve üyelik yönet
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EAEAEA]/40" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="E-posta, isim veya üyelik ara..."
          className="h-11 rounded-xl bg-[#1A1A2E] pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="flex items-center gap-3 rounded-2xl border border-[#EAEAEA]/10 bg-[#1A1A2E] p-4 transition hover:border-[#FF6B35]/40"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold">{u.name}</p>
                {u.role === "ADMIN" && (
                  <Badge className="bg-[#FF6B35]/20 text-[#FF6B35]">Admin</Badge>
                )}
                <Badge
                  variant="secondary"
                  className={
                    u.premiumActive
                      ? "bg-[#F1C40F]/20 text-[#F1C40F]"
                      : "bg-[#EAEAEA]/10 text-[#EAEAEA]/60"
                  }
                >
                  {u.membership}
                </Badge>
              </div>
              <p className="truncate text-sm text-[#EAEAEA]/50">{u.email}</p>
              <p className="mt-1 text-xs text-[#EAEAEA]/40">
                {u._count.fitnessPlans} plan · {u._count.dailyLogs} gün kayıt · AI $
                {u.displayAiCostUsd.toFixed(2)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#EAEAEA]/30" />
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-[#EAEAEA]/50">
            Sonuç yok
          </p>
        )}
      </div>
    </div>
  );
}
