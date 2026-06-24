"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (session) router.replace("/feed");
  }, [session, status, router]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Username atau password salah");
      } else {
        window.location.href = "/feed";
      }
    } catch (err) {
      setError("Gagal login. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return null;
  if (session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="text-lg font-bold text-[var(--text)]">Sosmed</span>
        </div>

        <h1 className="text-xl font-bold mb-6 text-[var(--text)]">Masuk ke akunmu</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg mb-4 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[14px]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[14px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] text-white py-2.5 rounded-lg text-[14px] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-[var(--text-secondary)] text-[13px] mt-6">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[var(--accent)] font-medium hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
