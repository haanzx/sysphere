import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// POST - Add moderator (set user role to moderator)
export async function POST(request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: "Username harus diisi" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json({ error: "Tidak bisa mengubah role admin" }, { status: 400 });
    }

    if (user.role === "moderator") {
      return NextResponse.json({ error: "User sudah menjadi moderator" }, { status: 400 });
    }

    user.role = "moderator";
    await user.save();

    return NextResponse.json({
      message: `${user.name} sekarang menjadi moderator`,
      user: { name: user.name, username: user.username, role: user.role },
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah moderator" }, { status: 500 });
  }
}

// DELETE - Remove moderator (set role back to user)
export async function DELETE(request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: "Username harus diisi" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.role !== "moderator") {
      return NextResponse.json({ error: "User bukan moderator" }, { status: 400 });
    }

    user.role = "user";
    await user.save();

    return NextResponse.json({
      message: `${user.name} bukan lagi moderator`,
      user: { name: user.name, username: user.username, role: user.role },
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus moderator" }, { status: 500 });
  }
}
