import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama tidak boleh kosong" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { name: name.trim() },
      { new: true }
    ).select("-password");

    return NextResponse.json({ message: "Profile berhasil diupdate", user });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update profile" }, { status: 500 });
  }
}
