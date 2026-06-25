import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const notifications = await Notification.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .populate("from", "name username role")
      .populate("post", "content")
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user: session.user.id,
      read: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil notifikasi" }, { status: 500 });
  }
}
