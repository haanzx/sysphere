"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import ThemeToggle from "@/components/ThemeToggle";

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    fetchPosts();
  }, [session, status, router]);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (res.ok) setPosts(data);
    } catch (error) {
      console.error("Gagal load posts");
    } finally {
      setLoading(false);
    }
  }

  function handlePostDeleted(postId) {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
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
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 mb-2">
        <h1 className="text-lg font-bold text-[var(--text)]">Beranda</h1>
        <div className="flex items-center gap-1">
          <a href="/search" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>

      <div className="px-4">
        <CreatePost onComplete={fetchPosts} />
      </div>

      <div className="px-4">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-secondary)] text-[14px]">Belum ada post</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={fetchPosts}
            />
          ))
        )}
      </div>
    </div>
  );
}
