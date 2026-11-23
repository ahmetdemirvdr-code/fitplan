"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Apple, Droplets, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Ana Sayfa", icon: Home },
  { href: "/workout", label: "Antrenman", icon: Dumbbell },
  { href: "/nutrition", label: "Beslenme", icon: Apple },
  { href: "/water", label: "Su", icon: Droplets },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2A3A5C]/50 bg-[#1A1A2E]/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex h-[4.25rem] max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 px-3 py-2 transition-all duration-200 ease-out ${
                isActive
                  ? "text-[#FF6B35]"
                  : "text-[#9CA3AF] active:text-[#EAEAEA]"
              }`}
            >
              <Icon
                className={`transition-all duration-200 ease-out ${
                  isActive
                    ? "h-6 w-6 scale-110 stroke-[2.5]"
                    : "h-5 w-5 stroke-[1.75]"
                }`}
              />
              <span
                className={`text-[11px] leading-none whitespace-nowrap transition-all duration-200 ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 h-1 w-1 animate-in fade-in rounded-full bg-[#FF6B35] duration-200" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
