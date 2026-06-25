import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function PUT() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    await Notification.updateMany(
      { user: session.user.id, read: false },
      { read: true }
    );

    return NextResponse.json({ message: "Notifikasi ditandai sudah dibaca" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update notifikasi" }, { status: 500 });
  }
}
