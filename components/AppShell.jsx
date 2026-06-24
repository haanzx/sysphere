"use client";

import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function AppShell({ children }) {
  return (
    <Suspense fallback={null}>
      <Sidebar />
      <div className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {children}
      </div>
      <BottomNav />
    </Suspense>
  );
}
