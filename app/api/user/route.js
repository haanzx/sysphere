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

    const user = await User.findById(session.user.id)
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ error: "Akun telah dinonaktifkan" }, { status: 403 });
    }

    return NextResponse.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      bio: user.bio || "",
      isActive: user.isActive,
      createdAt: user.createdAt,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
    });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = body.name;
    const bio = body.bio !== undefined ? body.bio : "";

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (bio.length > 160) {
      return NextResponse.json(
        { error: "Bio maksimal 160 karakter" },
        { status: 400 }
      );
    }

    await dbConnect();

    const updateData = {
      name: name.trim(),
      bio: bio,
    };

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile berhasil diupdate",
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        bio: user.bio || "",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("PUT /api/user error:", error);
    return NextResponse.json({ error: "Gagal update profile" }, { status: 500 });
  }
}
