import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import DeleteLog from "@/models/DeleteLog";

// GET - Dashboard stats, users list, and deletion logs
export async function GET() {
  try {
    const session = await auth();

    if (!session || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const [totalUsers, totalPosts, totalComments, users, deleteLogs] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      User.find({})
        .select("name username role isActive createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      DeleteLog.find({})
        .sort({ createdAt: -1 })
        .populate("deletedBy", "name username role")
        .populate("targetAuthor", "name username")
        .limit(100)
        .lean(),
    ]);

    const stats = {
      totalUsers,
      totalPosts,
      totalComments,
    };

    return NextResponse.json({ stats, users, deleteLogs });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// PUT - Ban/Unban user
export async function PUT(request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "userId dan action harus diisi" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json({ error: "Tidak bisa mengubah status admin" }, { status: 400 });
    }

    if (action === "ban") {
      user.isActive = false;
    } else if (action === "unban") {
      user.isActive = true;
    } else {
      return NextResponse.json({ error: "Action tidak valid (ban/unban)" }, { status: 400 });
    }

    await user.save();

    return NextResponse.json({
      message: `User ${user.name} berhasil ${action === "ban" ? "dibanned" : "diaktifkan kembali"}`,
      user: { id: user._id, name: user.name, username: user.username, isActive: user.isActive },
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengubah status user" }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId harus diisi" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json({ error: "Tidak bisa menghapus admin" }, { status: 400 });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      message: `User ${user.name} berhasil dihapus`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 });
  }
}
