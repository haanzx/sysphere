"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function CreatePost({ onComplete }) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError("");

    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm"];
    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      setUploadError("Tipe file tidak didukung");
      return;
    }

    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(isImage ? "Ukuran gambar maksimal 10MB" : "Ukuran video maksimal 50MB");
      return;
    }

    setMediaFile(file);
    setMediaType(isImage ? "image" : "video");

    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  }

  function removeMedia() {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadMedia() {
    if (!mediaFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", mediaFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Gagal mengunggah file");
        return null;
      }

      return data;
    } catch (error) {
      setUploadError("Gagal mengunggah file");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if ((!content.trim() && !mediaFile) || loading) return;

    setLoading(true);
    setUploadError("");

    try {
      let mediaData = null;

      if (mediaFile) {
        mediaData = await uploadMedia();
        if (!mediaData) {
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          media: mediaData,
        }),
      });

      if (res.ok) {
        setContent("");
        removeMedia();
        if (onComplete) onComplete();
        router.refresh();
      } else {
        const data = await res.json();
        setUploadError(data.error || "Gagal membuat post");
      }
    } catch (error) {
      setUploadError("Gagal membuat post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-xl p-4 mb-3 border border-[var(--border)] shadow-sm">
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis sesuatu..."
            className="w-full bg-transparent text-[14px] text-[var(--text)] placeholder-[var(--text-secondary)] resize-none focus:outline-none min-h-[60px]"
            rows={2}
          />
        </div>
      </div>

      {/* Media Preview */}
      {mediaPreview && (
        <div className="relative mt-2 mb-2">
          {mediaType === "image" ? (
            <img
              src={mediaPreview}
              alt="Preview"
              className="w-full max-h-80 object-cover rounded-xl border border-[var(--border)]"
            />
          ) : (
            <video
              src={mediaPreview}
              className="w-full max-h-80 rounded-xl border border-[var(--border)]"
              controls
            />
          )}
          <button
            type="button"
            onClick={removeMedia}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <div className="mb-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-[12px]">
          {uploadError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-xl text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors disabled:opacity-50"
            title="Tambah gambar/video"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM10.5 8.25a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" />
            </svg>
          </button>
          {(uploading || loading) && (
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] ml-1">
              <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              {uploading ? "Mengunggah..." : "Memposting..."}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || uploading || (!content.trim() && !mediaFile)}
          className="bg-[var(--accent)] text-white px-5 py-1.5 rounded-xl text-[13px] font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {loading ? "..." : "Posting"}
        </button>
      </div>
    </form>
  );
}
