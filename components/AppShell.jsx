"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function AppShell({ children }) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <Suspense fallback={null}>
      {isLoggedIn && <Sidebar />}
      <div className={isLoggedIn ? "md:ml-64 min-h-screen pb-20 md:pb-0" : "min-h-screen"}>
        {children}
      </div>
      {isLoggedIn && <BottomNav />}
    </Suspense>
  );
}
