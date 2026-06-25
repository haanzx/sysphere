"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    fetchNotifications();
    markAsRead();
  }, [session, status, router]);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Gagal mengambil notifikasi");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead() {
    try {
      await fetch("/api/notifications/read", { method: "PUT" });
    } catch (error) {
      console.error("Gagal menandai notifikasi");
    }
  }

  function getNotificationText(type) {
    switch (type) {
      case "follow":
        return "mengikuti Anda";
      case "like":
        return "menyukai post Anda";
      case "comment":
        return "mengomentari post Anda";
      default:
        return "";
    }
  }

  function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 mb-4">
        <h1 className="text-lg font-bold text-[var(--text)]">Notifikasi</h1>
        <ThemeToggle />
      </div>

      {/* Notifications List */}
      <div className="px-4">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-secondary)] text-[13px]">Belum ada notifikasi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 ${
                  !notif.read ? "border-l-2 border-l-[var(--accent)]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {notif.from?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/user/${notif.from?._id}`}
                        className="font-medium text-[14px] text-[var(--text)] hover:underline"
                      >
                        {notif.from?.name}
                      </Link>
                      <span className="text-[13px] text-[var(--text-secondary)]">
                        {getNotificationText(notif.type)}
                      </span>
                    </div>

                    {notif.type === "comment" && notif.commentContent && (
                      <p className="text-[13px] text-[var(--text-secondary)] mt-1 pl-0 border-l-2 border-[var(--border)] pl-2">
                        &quot;{notif.commentContent}&quot;
                      </p>
                    )}

                    {notif.type === "like" && notif.post?.content && (
                      <p className="text-[13px] text-[var(--text-secondary)] mt-1 truncate">
                        &quot;{notif.post.content.substring(0, 100)}&quot;
                      </p>
                    )}

                    <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                      {getTimeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
