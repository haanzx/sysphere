"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import PostCard from "@/components/PostCard";

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
  const [activeTab, setActiveTab] = useState("posts");

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
    month: "long",
    year: "numeric",
  });

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
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[var(--text)]">{user.name}</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">{posts.length} postingan</p>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-4 pb-3">
        {/* Avatar & Follow Button */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent)] to-sky-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          {!isOwnProfile && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`mt-14 px-6 py-1.5 rounded-full text-[13px] font-bold transition-all shadow-sm ${
                isFollowing
                  ? "bg-transparent text-[var(--text)] border border-[var(--border)] hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                  : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
              } disabled:opacity-50`}
            >
              {followLoading ? "..." : isFollowing ? "Mengikuti" : "Ikuti"}
            </button>
          )}
          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="mt-14 px-5 py-1.5 rounded-full border border-[var(--border)] text-[13px] font-semibold text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all shadow-sm"
            >
              Edit profile
            </Link>
          )}
        </div>

        {/* Name & Username */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--text)]">{user.name}</h2>
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
          <p className="text-[15px] text-[var(--text-secondary)]">@{user.username}</p>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-[15px] text-[var(--text)] leading-relaxed mb-3 whitespace-pre-wrap break-words">
            {user.bio}
          </p>
        )}

        {/* Join Date */}
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-[13px]">Bergabung {joinDate}</span>
        </div>

        {/* Stats */}
        <div className="flex gap-5">
          <Link href={`/user/${userId}/following`} className="group">
            <span className="font-bold text-[var(--text)] group-hover:underline">
              {user.followingCount || 0}
            </span>
            <span className="text-[15px] text-[var(--text-secondary)] ml-1">Mengikuti</span>
          </Link>
          <Link href={`/user/${userId}/followers`} className="group">
            <span className="font-bold text-[var(--text)] group-hover:underline">
              {user.followersCount || 0}
            </span>
            <span className="text-[15px] text-[var(--text-secondary)] ml-1">Pengikut</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 text-[14px] font-medium text-center transition-colors relative ${
            activeTab === "posts"
              ? "text-[var(--text)] font-bold"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          }`}
        >
          Postingan
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-[3px] bg-[var(--accent)] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("replies")}
          className={`flex-1 py-3 text-[14px] font-medium text-center transition-colors relative ${
            activeTab === "replies"
              ? "text-[var(--text)] font-bold"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          }`}
        >
          Balasan
          {activeTab === "replies" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-[3px] bg-[var(--accent)] rounded-full" />
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-[13px]">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-3">
        {activeTab === "posts" ? (
          posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)] text-[15px]">
                {isOwnProfile ? "Belum ada postingan" : `${user.name} belum ada postingan`}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostDeleted={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
              />
            ))
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)] text-[15px]">Belum ada balasan</p>
          </div>
        )}
      </div>
    </div>
  );
}
