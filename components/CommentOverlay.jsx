"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function CommentOverlay({ post, onClose, onCommentAdded }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`);
      const data = await res.json();
      if (res.ok) setComments(data);
    } catch (error) {
      console.error("Gagal load komentar");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendComment(e) {
    e.preventDefault();
    if (!newComment.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments([data.comment, ...comments]);
        setNewComment("");
        if (onCommentAdded) onCommentAdded();
      }
    } catch (error) {
      console.error("Gagal kirim komentar");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteComment(commentId) {
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        setComments(comments.filter((c) => c._id !== commentId));
      }
    } catch (error) {
      console.error("Gagal hapus komentar");
    } finally {
      setDeletingId(null);
    }
  }

  const date = new Date(post.createdAt);
  const timeAgo = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]" style={{ backgroundColor: 'var(--bg-card)' }}>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <svg className="w-5 h-5 text-[var(--text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="font-medium text-[15px] text-[var(--text)]">Komentar</h2>
        <div className="w-8" />
      </div>

      {/* Post */}
      <div className="p-4 border-b border-[var(--border)]" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {post.author?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[14px] text-[var(--text)]">{post.author?.name}</span>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)]">@{post.author?.username} · {timeAgo}</p>
            <p className="text-[14px] text-[var(--text)] mt-2 leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)] text-[13px]">Belum ada komentar</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isCommentOwner = session?.user?.id === comment.author?._id;
            const isPrivileged = session?.user?.role === "admin" || session?.user?.role === "moderator";
            const canDeleteComment = isCommentOwner || isPrivileged;
            return (
              <div key={comment._id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {comment.author?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[13px] text-[var(--text)]">{comment.author?.name}</span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      {new Date(comment.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {canDeleteComment && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        disabled={deletingId === comment._id}
                        className="ml-auto p-0.5 rounded text-[var(--text-secondary)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {deletingId === comment._id ? (
                          <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] text-[var(--text)] mt-0.5">{comment.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendComment} className="p-3 border-t border-[var(--border)]" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tulis komentar..."
            className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[13px]"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || sending}
            className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-[13px] font-medium disabled:opacity-50 transition-colors"
          >
            Kirim
          </button>
        </div>
      </form>
    </div>
  );
}
