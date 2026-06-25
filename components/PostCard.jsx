"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import CommentOverlay from "./CommentOverlay";

export default function PostCard({ post, onLikeToggle, onPostUpdated, onPostDeleted }) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentContent, setCurrentContent] = useState(post.content);

  const isOwner = session?.user?.id === post.author?._id;
  const isPrivileged = session?.user?.role === "admin" || session?.user?.role === "moderator";
  const canDelete = isOwner || isPrivileged;
  const canEdit = isOwner;

  const date = new Date(post.createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let timeAgo;
  if (diffMins < 1) timeAgo = "baru saja";
  else if (diffMins < 60) timeAgo = `${diffMins}m`;
  else if (diffHours < 24) timeAgo = `${diffHours}j`;
  else if (diffDays < 7) timeAgo = `${diffDays}h`;
  else {
    timeAgo = date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  async function handleLike() {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.liked);
        setLikeCount(data.count);
        if (onLikeToggle) onLikeToggle(post._id, data.liked, data.count);
      }
    } catch (error) {
      console.error("Gagal toggle like");
    } finally {
      setIsLiking(false);
    }
  }

  async function handleSaveEdit() {
    if (!editContent.trim() || editContent === currentContent) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setCurrentContent(editContent);
        setIsEditing(false);
        if (onPostUpdated) onPostUpdated();
      }
    } catch (error) {
      console.error("Gagal update post");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
      if (res.ok) {
        if (onPostDeleted) onPostDeleted(post._id);
      }
    } catch (error) {
      console.error("Gagal hapus post");
    }
  }

  return (
    <>
      <article className="bg-[var(--bg-card)] rounded-lg p-4 mb-3 border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {post.author?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[14px] text-[var(--text)]">{post.author?.name}</span>
              <span className="text-[var(--text-secondary)] text-[13px]">·</span>
              <span className="text-[var(--text-secondary)] text-[13px]">{timeAgo}</span>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)]">@{post.author?.username}</p>
          </div>

          {/* Menu */}
          {canDelete && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[130px] overflow-hidden">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setIsEditing(true);
                          setEditContent(currentContent);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors text-left"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors text-left"
                    >
                      Hapus
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3 text-[14px] text-[var(--text)] resize-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(currentContent);
                }}
                className="px-3 py-1 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim() || editContent === currentContent}
                className="px-3 py-1 text-[12px] text-white bg-[var(--accent)] rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
              >
                {isSaving ? "..." : "Simpan"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-[var(--text)] leading-relaxed whitespace-pre-wrap break-words mb-3">{currentContent}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-[var(--border)]">
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-[13px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            <span>{commentCount > 0 ? commentCount : ""}</span>
          </button>

          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-red-500 transition-colors text-[13px]"
          >
            {isLiked ? (
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )}
            <span className={isLiked ? 'text-red-500' : ''}>{likeCount > 0 ? likeCount : ""}</span>
          </button>
        </div>
      </article>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[var(--bg-card)] rounded-xl p-5 w-full max-w-sm border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-[var(--text)] mb-1">Hapus post?</h3>
            <p className="text-[13px] text-[var(--text-secondary)] mb-5">Tidak bisa dikembalikan.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-[13px] text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showComments && (
        <CommentOverlay
          post={post}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount((prev) => prev + 1)}
        />
      )}
    </>
  );
}
