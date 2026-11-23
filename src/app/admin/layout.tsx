"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, LogOut, Loader2, MessageSquareText } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [allowed, setAllowed] = useState(false);

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) {
      setAllowed(true);
      return;
    }
    if (status === "loading") return;

    async function gate() {
      if (status === "unauthenticated") {
        router.replace("/admin/login");
        return;
      }

      if (session?.user?.role === "ADMIN") {
        setAllowed(true);
        return;
      }

      // Token role may be stale — confirm via API once.
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          setAllowed(true);
          return;
        }
      } catch {
        // ignore network errors; fall through to deny
      }

      // Clear session so middleware won't bounce login ↔ admin forever.
      await signOut({ redirect: false });
      router.replace("/admin/login");
    }

    void gate();
  }, [status, session, router, isLogin]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (!allowed || status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0f1424]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  const nav = [
    { href: "/admin", label: "Özet", icon: LayoutDashboard },
    { href: "/admin/users", label: "Kullanıcılar", icon: Users },
    { href: "/admin/ai-logs", label: "AI Logları", icon: MessageSquareText },
  ];

  return (
    <div className="min-h-dvh bg-[#0f1424] text-[#EAEAEA]">
      <header className="border-b border-[#EAEAEA]/10 bg-[#1A1A2E]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BrandLogo height={28} />
            <span className="text-sm font-semibold text-[#EAEAEA]/70">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-[#EAEAEA]/50 sm:inline">
              {session?.user?.email}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex items-center gap-1 text-[#EAEAEA]/60 hover:text-[#EAEAEA]"
            >
              <LogOut size={16} />
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-44 shrink-0 md:block">
          <nav className="space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-[#FF6B35]/15 text-[#FF6B35]"
                      : "text-[#EAEAEA]/60 hover:bg-[#1A1A2E] hover:text-[#EAEAEA]"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-[#EAEAEA]/10 bg-[#1A1A2E] md:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] ${
                active ? "text-[#FF6B35]" : "text-[#EAEAEA]/50"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
