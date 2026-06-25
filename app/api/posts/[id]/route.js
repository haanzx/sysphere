import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import DeleteLog from "@/models/DeleteLog";
import { validatePostContent, validateMedia } from "@/lib/validation";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const session = await auth();

    await dbConnect();

    const post = await Post.findById(id)
      .populate("author", "name username role")
      .lean();

    if (!post) {
      return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
    }

    const commentCount = await Comment.countDocuments({ post: post._id });

    return NextResponse.json({
      ...post,
      likeCount: post.likes?.length || 0,
      commentCount,
      isLiked: session
        ? post.likes?.some((id) => id.toString() === session.user.id)
        : false,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil post" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content, media } = body;

    const hasContent = content && content.trim().length > 0;
    const hasMedia = media && media.url && media.type;

    if (!hasContent && !hasMedia) {
      return NextResponse.json(
        { error: "Postingan harus memiliki konten atau gambar/video" },
        { status: 400 }
      );
    }

    if (content) {
      const contentValidation = validatePostContent(content);
      if (!contentValidation.valid) {
        return NextResponse.json({ error: contentValidation.error }, { status: 400 });
      }
    }

    if (media) {
      const mediaValidation = validateMedia(media);
      if (!mediaValidation.valid) {
        return NextResponse.json({ error: mediaValidation.error }, { status: 400 });
      }
    }

    await dbConnect();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
    }

    if (post.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "Tidak ada akses" }, { status: 403 });
    }

    post.content = content?.trim() || "";

    if (hasMedia) {
      post.media = {
        url: media.url,
        type: media.type,
        publicId: media.publicId || "",
      };
    } else if (media === null) {
      post.media = { url: "", type: "", publicId: "" };
    }

    await post.save();

    const updated = await Post.findById(id)
      .populate("author", "name username role")
      .lean();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Gagal update post" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = session.user.role;
    const isPrivileged = userRole === "admin" || userRole === "moderator";

    await dbConnect();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
    }

    const isOwner = post.author.toString() === session.user.id;

    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: "Tidak ada akses" }, { status: 403 });
    }

    // Log if privileged user deletes someone else's post
    if (!isOwner && isPrivileged) {
      await DeleteLog.create({
        deletedBy: session.user.id,
        targetType: "post",
        targetId: post._id,
        targetAuthor: post.author,
        targetContent: post.content.substring(0, 200),
      });
    }

    await Comment.deleteMany({ post: id });
    await Post.findByIdAndDelete(id);

    return NextResponse.json({ message: "Post berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus post" }, { status: 500 });
  }
}
