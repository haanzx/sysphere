"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import ThemeToggle from "@/components/ThemeToggle";

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");

  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    fetchUserData();
  }, [session, status, router, userId]);

  async function fetchUserData() {
    try {
      const [userRes, postsRes] = await Promise.all([
        fetch(`/api/user/${userId}`),
        fetch(`/api/user/${userId}/posts`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        setIsFollowing(userData.isFollowing || false);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }
    } catch (error) {
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow() {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/user/${userId}/follow`, { method });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setUser((prev) => ({
          ...prev,
          followersCount: isFollowing
            ? (prev.followersCount || 1) - 1
            : (prev.followersCount || 0) + 1,
        }));
      }
    } catch (error) {
      console.error("Gagal follow/unfollow");
    } finally {
      setFollowLoading(false);
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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 mb-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <svg className="w-5 h-5 text-[var(--text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-[var(--text)]">Profil</h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* Profile */}
      <div className="px-4 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
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
            <p className="text-[13px] text-[var(--text-secondary)] mb-1">@{user.username}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">Bergabung {joinDate}</p>
          </div>
        </div>

        {/* Follow Button */}
        {!isOwnProfile && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`w-full py-2 rounded-lg text-[13px] font-medium transition-colors ${
              isFollowing
                ? "bg-[var(--bg-secondary)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)]"
                : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            } disabled:opacity-50`}
          >
            {followLoading ? "..." : isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <Link href={`/user/${userId}/following`} className="text-center">
            <p className="font-bold text-[var(--text)]">{user.followingCount || 0}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">Mengikuti</p>
          </Link>
          <Link href={`/user/${userId}/followers`} className="text-center">
            <p className="font-bold text-[var(--text)]">{user.followersCount || 0}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">Pengikut</p>
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-[13px]">
          {error}
        </div>
      )}

      {/* Posts */}
      <div className="px-4">
        <h3 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
          Post oleh {user.name}
        </h3>
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-secondary)] text-[13px]">Belum ada post</p>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
