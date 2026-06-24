"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LxAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [deleteLogs, setDeleteLogs] = useState([]);
  const [addModUsername, setAddModUsername] = useState("");
  const [addModLoading, setAddModLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("moderators");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.user.role !== "admin") {
      router.replace("/feed");
      return;
    }
    fetchData();
  }, [session, status, router]);

  async function fetchData() {
    try {
      const res = await fetch("/api/lxadmin");
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.admins || []);
        setModerators(data.moderators || []);
        setDeleteLogs(data.deleteLogs || []);
      }
    } catch (error) {
      console.error("Gagal load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddModerator(e) {
    e.preventDefault();
    if (!addModUsername.trim()) return;
    setAddModLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/lxadmin/moderator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: addModUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setMessage(data.message);
        setAddModUsername("");
        fetchData();
      }
    } catch (error) {
      setError("Gagal menambah moderator");
    } finally {
      setAddModLoading(false);
    }
  }

  async function handleRemoveModerator(username) {
    try {
      const res = await fetch("/api/lxadmin/moderator", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setMessage(data.message);
        fetchData();
      }
    } catch (error) {
      setError("Gagal menghapus moderator");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || session.user.role !== "admin") return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 mb-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">lxAdmin</h1>
          <p className="text-[12px] text-[var(--text-secondary)]">Panel administrasi</p>
        </div>
        <ThemeToggle />
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

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {[
          { value: "moderators", label: "Moderator" },
          { value: "admins", label: "Admin" },
          { value: "logs", label: "Riwayat" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
            }`}
          >
            {tab.label}
            {tab.value === "logs" && deleteLogs.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{deleteLogs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Moderators Tab */}
      {activeTab === "moderators" && (
        <div className="px-4">
          {/* Add Moderator */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 mb-4">
            <h3 className="font-medium text-[14px] text-[var(--text)] mb-3">Tambah Moderator</h3>
            <form onSubmit={handleAddModerator} className="flex gap-2">
              <input
                type="text"
                value={addModUsername}
                onChange={(e) => setAddModUsername(e.target.value)}
                placeholder="Username"
                className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)] text-[13px] focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={addModLoading || !addModUsername.trim()}
                className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
              >
                {addModLoading ? "..." : "Tambah"}
              </button>
            </form>
          </div>

          {/* List Moderators */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)]">
              <h3 className="font-medium text-[13px] text-[var(--text)]">Moderator ({moderators.length})</h3>
            </div>
            {moderators.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[var(--text-secondary)] text-[13px]">Belum ada moderator</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {moderators.map((mod) => (
                  <div key={mod._id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text)] text-sm font-medium">
                        {mod.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[13px] text-[var(--text)]">{mod.name}</p>
                        <p className="text-[12px] text-[var(--text-secondary)]">@{mod.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveModerator(mod.username)}
                      className="px-2.5 py-1 text-[12px] text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === "admins" && (
        <div className="px-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)]">
              <h3 className="font-medium text-[13px] text-[var(--text)]">Admin ({admins.length})</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {admins.map((admin) => (
                <div key={admin._id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-medium">
                    {admin.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[13px] text-[var(--text)]">{admin.name}</p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-light)] text-[var(--accent)]">
                        Admin
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)]">@{admin.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="px-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)]">
              <h3 className="font-medium text-[13px] text-[var(--text)]">Riwayat Penghapusan ({deleteLogs.length})</h3>
            </div>
            {deleteLogs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[var(--text-secondary)] text-[13px]">Belum ada riwayat</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {deleteLogs.map((log) => (
                  <div key={log._id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-light)] text-[var(--accent)]">
                        {log.targetType === "post" ? "Post" : "Komentar"}
                      </span>
                      <span className="text-[12px] text-[var(--text-secondary)]">
                        dihapus oleh <span className="font-medium text-[var(--text)]">{log.deletedBy?.name}</span>
                      </span>
                      <span className="text-[12px] text-[var(--text-secondary)]">
                        milik <span className="font-medium text-[var(--text)]">{log.targetAuthor?.name}</span>
                      </span>
                    </div>
                    {log.targetContent && (
                      <p className="text-[12px] text-[var(--text-secondary)] truncate ml-16">
                        &quot;{log.targetContent}&quot;
                      </p>
                    )}
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 ml-16">
                      {new Date(log.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
