"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
