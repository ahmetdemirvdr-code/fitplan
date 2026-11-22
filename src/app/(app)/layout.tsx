"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Apple, Droplets, User, TrendingUp } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Ana Sayfa", icon: Home },
  { href: "/workout", label: "Antrenman", icon: Dumbbell },
  { href: "/nutrition", label: "Beslenme", icon: Apple },
  { href: "/water", label: "Su", icon: Droplets },
  { href: "/progress", label: "İlerleme", icon: TrendingUp },
  { href: "/profile", label: "Profil", icon: User },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#1A1A2E] text-[#EAEAEA]">
      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">{children}</main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#16213E] bg-[#1A1A2E]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-2 transition-colors duration-150 ${
                isActive
                  ? "text-[#FF6B35]"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#FF6B35]" />
              )}
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
