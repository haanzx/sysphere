import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const session = await auth();

    await dbConnect();

    const user = await User.findById(id)
      .select("name username role followers following createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ error: "User tidak aktif" }, { status: 404 });
    }

    let isFollowing = false;
    if (session) {
      isFollowing = user.followers?.some(
        (followerId) => followerId.toString() === session.user.id
      );
    }

    return NextResponse.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      isFollowing,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}
