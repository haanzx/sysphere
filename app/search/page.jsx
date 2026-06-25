"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PostCard from "@/components/PostCard";

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
  }, [session, status, router]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setPosts(data.posts || []);

        const followState = {};
        for (const u of data.users || []) {
          followState[u._id] = u.isFollowing || false;
        }
        setFollowingMap(followState);
      }
    } catch (error) {
      console.error("Gagal mencari");
    } finally {
      setLoading(false);
    }
  }, [query, type]);

  async function handleFollow(userId) {
    try {
      const isFollowing = followingMap[userId];
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/user/${userId}/follow`, { method });
      if (res.ok) {
        setFollowingMap((prev) => ({
          ...prev,
          [userId]: !isFollowing,
        }));
      }
    } catch (error) {
      console.error("Gagal follow/unfollow");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSearch();
  }

  if (status === "loading") return null;
  if (!session) return null;

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 mb-2">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <svg className="w-5 h-5 text-[var(--text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-[var(--text)]">Cari</h1>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari user atau post..."
            className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[14px]"
            autoFocus
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Cari"}
          </button>
        </form>

        <div className="flex gap-2 mt-3">
          {[
            { value: "all", label: "Semua" },
            { value: "user", label: "User" },
            { value: "post", label: "Post" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setType(tab.value);
                if (searched) handleSearch();
              }}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                type === tab.value
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4">
        {!searched ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-secondary)] text-[13px]">Ketik untuk mulai mencari</p>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            {(type === "all" || type === "user") && users.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">User</h3>
                <div className="space-y-1">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <Link href={`/user/${user._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[14px] text-[var(--text)] truncate">{user.name}</span>
                            {user.role === "admin" && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-light)] text-[var(--accent)]">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[var(--text-secondary)] truncate">@{user.username}</p>
                        </div>
                      </Link>
                      {session?.user?.id !== user._id && (
                        <button
                          onClick={() => handleFollow(user._id)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                            followingMap[user._id]
                              ? "bg-[var(--bg-secondary)] text-[var(--text)] border border-[var(--border)]"
                              : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                          }`}
                        >
                          {followingMap[user._id] ? "Unfollow" : "Follow"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(type === "all" || type === "post") && posts.length > 0 && (
              <div>
                <h3 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">Post</h3>
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}

            {users.length === 0 && posts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-[var(--text-secondary)] text-[13px]">Tidak ada hasil</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
