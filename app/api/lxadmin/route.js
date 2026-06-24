import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import DeleteLog from "@/models/DeleteLog";

// GET - List admins, moderators, and deletion logs
export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const admins = await User.find({ role: "admin" })
      .select("name username role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const moderators = await User.find({ role: "moderator" })
      .select("name username role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const deleteLogs = await DeleteLog.find({})
      .sort({ createdAt: -1 })
      .populate("deletedBy", "name username role")
      .populate("targetAuthor", "name username")
      .limit(100)
      .lean();

    return NextResponse.json({ admins, moderators, deleteLogs });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}
