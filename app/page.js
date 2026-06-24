"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left */}
      <div className="lg:flex-1 bg-[var(--accent)] p-8 lg:p-16 flex flex-col justify-center items-center text-white relative">
        <div className="relative z-10 text-center max-w-md">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold mb-8 mx-auto">
            S
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Sosmed
          </h1>
          <p className="text-white/80">
            Berbagi ide dan pikiran dengan komunitasmu.
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="lg:flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="text-lg font-bold text-[var(--text)]">Sosmed</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-1">Mulai sekarang</h2>
            <p className="text-[var(--text-secondary)] text-[14px]">Bergabung dan mulai berbagi.</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-[var(--accent)] text-white py-2.5 rounded-lg text-[14px] font-medium hover:bg-[var(--accent-hover)] transition-colors text-center"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="block w-full border border-[var(--border)] text-[var(--text)] py-2.5 rounded-lg text-[14px] font-medium hover:bg-[var(--bg-secondary)] transition-colors text-center"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
