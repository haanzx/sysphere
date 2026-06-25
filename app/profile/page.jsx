"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    fetchUser();
  }, [session, status, router]);

  async function fetchUser() {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setName(data.name);
      }
    } catch (error) {
      console.error("Gagal load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateName(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal update");
      } else {
        setMessage("Nama berhasil diupdate!");
        setUser(data);
        await update({ name: data.name });
      }
    } catch (error) {
      setError("Gagal update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setChangingPassword(true);
    setError("");
    setMessage("");
    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter");
      setChangingPassword(false);
      return;
    }
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal ubah password");
      } else {
        setMessage("Password berhasil diubah!");
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (error) {
      setError("Gagal ubah password");
    } finally {
      setChangingPassword(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !user) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 mb-4">
        <h1 className="text-xl font-bold text-[var(--text)]">Profil</h1>
        <ThemeToggle />
      </div>

      {/* Profile */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--text)]">{user.name}</h2>
              {user.role === "admin" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-light)] text-[var(--accent)]">
                  Admin
                </span>
              )}
              {user.role === "moderator" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700">
                  Mod
                </span>
              )}
            </div>
            <p className="text-[13px] text-[var(--text-secondary)]">@{user.username}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">Bergabung {joinDate}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          <Link href="/profile/following" className="text-center">
            <p className="font-bold text-[var(--text)]">{user.followingCount || 0}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">Mengikuti</p>
          </Link>
          <Link href="/profile/followers" className="text-center">
            <p className="font-bold text-[var(--text)]">{user.followersCount || 0}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">Pengikut</p>
          </Link>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mx-4 mb-3 bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-lg text-[13px]">
          {message}
        </div>
      )}
      {error && (
        <div className="mx-4 mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-[13px]">
          {error}
        </div>
      )}

      {/* Edit Name */}
      <div className="mx-4 mb-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
        <h3 className="font-medium text-[14px] text-[var(--text)] mb-3">Ubah Nama</h3>
        <form onSubmit={handleUpdateName} className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-[13px] focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={saving || name === user.name}
            className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {saving ? "..." : "Simpan"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="mx-4 mb-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
        <h3 className="font-medium text-[14px] text-[var(--text)] mb-3">Ubah Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-2">
          <input
            type="password"
            placeholder="Password saat ini"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)] text-[13px] focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
          <input
            type="password"
            placeholder="Password baru"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)] text-[13px] focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={changingPassword || !currentPassword || !newPassword}
            className="w-full py-2 bg-[var(--bg-secondary)] text-[var(--text)] border border-[var(--border)] rounded-lg text-[13px] font-medium hover:bg-[var(--border)] disabled:opacity-50 transition-colors"
          >
            {changingPassword ? "Mengubah..." : "Ubah Password"}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="mx-4 mb-6">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full py-2.5 bg-red-50 text-red-500 border border-red-200 rounded-lg text-[13px] font-medium hover:bg-red-100 transition-colors"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}
