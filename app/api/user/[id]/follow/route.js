import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json({ error: "Tidak bisa follow diri sendiri" }, { status: 400 });
    }

    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (targetUser.isActive === false) {
      return NextResponse.json({ error: "User tidak aktif" }, { status: 400 });
    }

    const currentUser = await User.findById(session.user.id);

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      return NextResponse.json({ error: "Sudah follow user ini" }, { status: 400 });
    }

    currentUser.following.push(id);
    targetUser.followers.push(session.user.id);

    await currentUser.save();
    await targetUser.save();

    await Notification.create({
      user: id,
      from: session.user.id,
      type: "follow",
    });

    return NextResponse.json({ message: "Berhasil follow user", following: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal follow user" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const currentUser = await User.findById(session.user.id);

    const isFollowing = currentUser.following.includes(id);

    if (!isFollowing) {
      return NextResponse.json({ error: "Belum follow user ini" }, { status: 400 });
    }

    currentUser.following = currentUser.following.filter((uid) => uid.toString() !== id);
    targetUser.followers = targetUser.followers.filter((uid) => uid.toString() !== session.user.id);

    await currentUser.save();
    await targetUser.save();

    return NextResponse.json({ message: "Berhasil unfollow user", following: false });
  } catch (error) {
    return NextResponse.json({ error: "Gagal unfollow user" }, { status: 500 });
  }
}
