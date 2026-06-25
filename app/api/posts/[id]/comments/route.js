import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import DeleteLog from "@/models/DeleteLog";
import Notification from "@/models/Notification";
import { applyRateLimit } from "@/lib/rateLimit";
import { validateComment } from "@/lib/validation";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    await dbConnect();

    const comments = await Comment.find({ post: id })
      .sort({ createdAt: -1 })
      .populate("author", "name username role isActive")
      .lean();

    const activeComments = comments.filter((comment) => comment.author?.isActive !== false);

    return NextResponse.json(activeComments);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil komentar" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = applyRateLimit(request, "comment", 20, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak request. Coba lagi dalam beberapa saat." },
        { status: 429 }
      );
    }

    const { id } = await params;
    const { content } = await request.json();

    const validation = validateComment(content);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await dbConnect();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
    }

    const comment = await Comment.create({
      content: content.trim(),
      author: session.user.id,
      post: id,
    });

    if (post.author.toString() !== session.user.id) {
      await Notification.create({
        user: post.author,
        from: session.user.id,
        type: "comment",
        post: post._id,
        commentContent: content.trim().substring(0, 200),
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "name username role")
      .lean();

    return NextResponse.json(
      { message: "Komentar berhasil ditambahkan", comment: populatedComment },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambahkan komentar" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await request.json();
    const userRole = session.user.role;
    const isPrivileged = userRole === "admin" || userRole === "moderator";

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId harus diisi" },
        { status: 400 }
      );
    }

    await dbConnect();

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return NextResponse.json({ error: "Komentar tidak ditemukan" }, { status: 404 });
    }

    const isOwner = comment.author.toString() === session.user.id;

    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: "Tidak ada akses" }, { status: 403 });
    }

    // Log if privileged user deletes someone else's comment
    if (!isOwner && isPrivileged) {
      await DeleteLog.create({
        deletedBy: session.user.id,
        targetType: "comment",
        targetId: comment._id,
        targetAuthor: comment.author,
        targetContent: comment.content.substring(0, 200),
      });
    }

    await Comment.findByIdAndDelete(commentId);

    return NextResponse.json({ message: "Komentar berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus komentar" }, { status: 500 });
  }
}
