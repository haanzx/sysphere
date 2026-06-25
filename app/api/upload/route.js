import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rateLimit";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

async function uploadToCloudinary(file, folder) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto",
          moderation: "aws_rek",
          allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "webm"],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
    return result;
  } catch (moderationError) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto",
          allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "webm"],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
    return result;
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = applyRateLimit(request, "upload", 10, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak request. Coba lagi dalam beberapa saat." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Gunakan JPG, PNG, GIF, WebP, MP4, MOV, atau WebM" },
        { status: 400 }
      );
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      const maxMB = isImage ? 10 : 50;
      return NextResponse.json(
        { error: `Ukuran file maksimal ${maxMB}MB` },
        { status: 400 }
      );
    }

    const result = await uploadToCloudinary(file, "sosmed-uploads");

    if (result.moderation && result.moderation.length > 0) {
      const mod = result.moderation[0];
      const isRejected = mod.status === "rejected" || mod.status === "pending";

      if (isRejected) {
        try {
          await cloudinary.uploader.destroy(result.public_id, {
            resource_type: result.resource_type,
          });
        } catch (deleteError) {
          console.error("Gagal hapus file NSFW:", deleteError);
        }
        return NextResponse.json(
          { error: "Konten yang kamu upload tidak dapat diterima karena mengandung konten yang tidak pantas" },
          { status: 400 }
        );
      }
    }

    const mediaType = result.resource_type === "video" ? "video" : "image";

    return NextResponse.json({
      url: result.secure_url,
      type: mediaType,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json(
      { error: "Gagal mengunggah file. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
