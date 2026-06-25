export function validatePostContent(content) {
  if (!content && content !== "") return { valid: true };
  if (typeof content !== "string") return { valid: false, error: "Content harus berupa teks" };
  if (content.length > 5000) return { valid: false, error: "Caption maksimal 5000 karakter" };
  return { valid: true };
}

export function validateComment(content) {
  if (!content || typeof content !== "string") return { valid: false, error: "Komentar harus diisi" };
  if (content.trim().length === 0) return { valid: false, error: "Komentar tidak boleh kosong" };
  if (content.length > 1000) return { valid: false, error: "Komentar maksimal 1000 karakter" };
  return { valid: true };
}

export function validateName(name) {
  if (!name || typeof name !== "string") return { valid: false, error: "Nama harus diisi" };
  if (name.trim().length === 0) return { valid: false, error: "Nama tidak boleh kosong" };
  if (name.length > 50) return { valid: false, error: "Nama maksimal 50 karakter" };
  return { valid: true };
}

export function validateBio(bio) {
  if (!bio || bio === "") return { valid: true };
  if (typeof bio !== "string") return { valid: false, error: "Bio harus berupa teks" };
  if (bio.length > 160) return { valid: false, error: "Bio maksimal 160 karakter" };
  return { valid: true };
}

export function validatePassword(password) {
  if (!password || typeof password !== "string") return { valid: false, error: "Password harus diisi" };
  if (password.length < 6) return { valid: false, error: "Password minimal 6 karakter" };
  if (password.length > 100) return { valid: false, error: "Password maksimal 100 karakter" };
  return { valid: true };
}

export function validateUsername(username) {
  if (!username || typeof username !== "string") return { valid: false, error: "Username harus diisi" };
  if (username.trim().length === 0) return { valid: false, error: "Username tidak boleh kosong" };
  if (username.length < 3) return { valid: false, error: "Username minimal 3 karakter" };
  if (username.length > 20) return { valid: false, error: "Username maksimal 20 karakter" };
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return { valid: false, error: "Username hanya boleh huruf, angka, dan underscore" };
  return { valid: true };
}

export function sanitizeSearchQuery(query) {
  if (!query || typeof query !== "string") return "";
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escaped.trim();
}

export function validateMedia(media) {
  if (!media) return { valid: true };
  if (typeof media !== "object") return { valid: false, error: "Format media tidak valid" };
  if (!media.url || typeof media.url !== "string") return { valid: false, error: "URL media tidak valid" };
  if (!media.type || !["image", "video"].includes(media.type)) return { valid: false, error: "Tipe media tidak valid" };
  if (media.url.length > 500) return { valid: false, error: "URL media terlalu panjang" };
  return { valid: true };
}
