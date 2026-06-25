import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    await dbConnect();

    const user = await User.findById(id)
      .populate("followers", "name username role")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(user.followers || []);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil followers" }, { status: 500 });
  }
}
