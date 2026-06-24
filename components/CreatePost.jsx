"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePost({ onComplete }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setContent("");
        if (onComplete) onComplete();
        router.refresh();
      }
    } catch (error) {
      console.error("Gagal membuat post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-lg p-4 mb-3 border border-[var(--border)]">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Tulis sesuatu..."
        className="w-full bg-transparent text-[14px] text-[var(--text)] placeholder-[var(--text-secondary)] resize-none focus:outline-none min-h-[60px]"
        rows={2}
      />
      <div className="flex justify-end mt-2 pt-2 border-t border-[var(--border)]">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-[var(--accent)] text-white px-4 py-1.5 rounded-lg text-[13px] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "..." : "Posting"}
        </button>
      </div>
    </form>
  );
}
