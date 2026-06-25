"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function UserFollowingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    fetchFollowing();
  }, [session, status, router, userId]);

  async function fetchFollowing() {
    try {
      const res = await fetch(`/api/user/${userId}/following`);
      if (res.ok) {
        const data = await res.json();
        setFollowing(data);
        const map = {};
        data.forEach((u) => { map[u._id] = true; });
        setFollowingMap(map);
      }
    } catch (error) {
      console.error("Gagal load following");
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow(targetUserId) {
    try {
      const isFollowing = followingMap[targetUserId];
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/user/${targetUserId}/follow`, { method });
      if (res.ok) {
        setFollowingMap((prev) => ({ ...prev, [targetUserId]: !isFollowing }));
      }
    } catch (error) {
      console.error("Gagal follow/unfollow");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-[var(--text)]">Mengikuti</h1>
        </div>
      </div>

      {/* List */}
      <div>
        {following.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)] text-[15px]">Belum mengikuti siapapun</p>
          </div>
        ) : (
          following.map((user) => (
            <div key={user._id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              <Link href={`/user/${user._id}`} className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-sky-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/user/${user._id}`} className="block">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-[14px] text-[var(--text)] truncate">{user.name}</span>
                    {user.role === "admin" && (
                      <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-light)] text-[var(--accent)]">
                        Admin
                      </span>
                    )}
                    {user.role === "moderator" && (
                      <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700">
                        Mod
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)]">@{user.username}</p>
                </Link>
              </div>
              {user._id !== session?.user?.id && (
                <button
                  onClick={() => handleFollow(user._id)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all shadow-sm ${
                    followingMap[user._id]
                      ? "bg-transparent text-[var(--text)] border border-[var(--border)] hover:border-red-300 hover:text-red-500"
                      : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                  }`}
                >
                  {followingMap[user._id] ? "Mengikuti" : "Ikuti"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
