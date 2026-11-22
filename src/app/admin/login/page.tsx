"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Giriş başarısız");
        setLoading(false);
        return;
      }

      const me = await fetch("/api/admin/stats");
      if (!me.ok) {
        toast.error("Bu hesap admin değil");
        setLoading(false);
        return;
      }

      toast.success("Admin paneline hoş geldin");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0f1424] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#EAEAEA]/10 bg-[#1A1A2E] p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
            <Shield size={22} />
          </div>
          <h1 className="text-xl font-bold text-[#EAEAEA]">Admin Girişi</h1>
          <p className="mt-1 text-sm text-[#EAEAEA]/50">FitPlan yönetim paneli</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">E-posta</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl bg-[#16213E]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Şifre</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl bg-[#16213E]"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-[#FF6B35] font-semibold hover:bg-[#E55A25]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Giriş Yap"}
          </Button>
        </form>
      </div>
    </div>
  );
}
