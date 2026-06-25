"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
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
        setBio(data.bio || "");
      }
    } catch (error) {
      console.error("Gagal load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bio: bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal update");
      } else {
        setUser(data.user);
        setName(data.user.name);
        setBio(data.user.bio || "");
        await update({ name: data.user.name });
        setMessage("Profile berhasil diupdate!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setError("Gagal update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
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
        setTimeout(() => setMessage(""), 3000);
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

  const hasChanges = name !== user.name || bio !== (user.bio || "");
  const canSaveProfile = hasChanges && name.trim() !== "";
  const canChangePassword = currentPassword.length > 0 && newPassword.length >= 6;

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-[var(--text)]">Edit profile</h1>
          <div className="flex-1" />
          <button
            onClick={handleSaveProfile}
            disabled={!canSaveProfile || saving}
            className="px-5 py-1.5 rounded-full bg-[var(--accent)] text-white text-[13px] font-bold hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-all shadow-sm"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Simpan
              </span>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mx-4 mt-3 bg-[var(--accent-light)] border border-[var(--accent)] text-[var(--accent-hover)] px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Profile Section */}
      <div className="px-4 pt-6 pb-4">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--accent)] to-sky-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {name?.charAt(0).toUpperCase() || "?"}
          </div>
        </div>

        {/* Name Field */}
        <div className="mb-4">
          <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
            Nama
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[15px] text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
            placeholder="Nama kamu"
          />
        </div>

        {/* Bio Field */}
        <div className="mb-4">
          <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            rows={3}
            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[15px] text-[var(--text)] resize-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
            placeholder="Ceritakan tentang diri kamu..."
          />
          <div className="flex justify-end mt-1.5">
            <span className={`text-[12px] font-medium ${bio.length > 150 ? "text-red-500" : "text-[var(--text-secondary)]"}`}>
              {bio.length}/160
            </span>
          </div>
        </div>

        {/* Username (Read Only) */}
        <div className="mb-4">
          <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
            Username
          </label>
          <div className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[15px] text-[var(--text-secondary)] cursor-not-allowed opacity-60">
            @{user.username}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-2 bg-[var(--bg-secondary)] border-y border-[var(--border)]" />

      {/* Password Section */}
      <div className="px-4 py-5">
        <h3 className="text-[15px] font-bold text-[var(--text)] mb-4">Ubah Password</h3>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
              Password saat ini
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[15px] text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
              placeholder="Masukkan password saat ini"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
              Password baru
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[15px] text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
              placeholder="Masukkan password baru"
            />
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-[12px] text-red-500 mt-1.5 font-medium">Minimal 6 karakter</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canChangePassword || changingPassword}
            className="w-full py-3 bg-[var(--bg-secondary)] text-[var(--text)] border border-[var(--border)] rounded-xl text-[14px] font-semibold hover:bg-[var(--border)] disabled:opacity-50 transition-all"
          >
            {changingPassword ? "Mengubah..." : "Ubah Password"}
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="h-2 bg-[var(--bg-secondary)] border-y border-[var(--border)]" />

      {/* Danger Zone */}
      <div className="px-4 py-5">
        <h3 className="text-[15px] font-bold text-[var(--text)] mb-2">Keluar</h3>
        <p className="text-[13px] text-[var(--text-secondary)] mb-4">
          Kamu akan keluar dari akun ini dan harus login kembali.
        </p>
        <button
          onClick={() => {
            import("next-auth/react").then(({ signOut }) => {
              signOut({ callbackUrl: "/login" });
            });
          }}
          className="w-full py-3 bg-red-50 text-red-500 border border-red-200 rounded-xl text-[14px] font-semibold hover:bg-red-100 transition-all"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}
