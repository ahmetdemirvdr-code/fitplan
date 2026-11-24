"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [inAndroidApp, setInAndroidApp] = useState(false);

  useEffect(() => {
    const isApp = /StriveAndroidApp/i.test(navigator.userAgent);
    setInAndroidApp(isApp);
    if (isApp) {
      document.documentElement.classList.add("strive-android-app");
      document.body.classList.add("strive-android-app");
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[#1A1A2E] text-[#EAEAEA]">
      <main
        className={
          inAndroidApp
            ? "flex-1 pb-16"
            : "flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"
        }
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
