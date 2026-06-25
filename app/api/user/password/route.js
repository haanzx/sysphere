import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { applyRateLimit } from "@/lib/rateLimit";
import { validatePassword } from "@/lib/validation";

export async function PUT(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = applyRateLimit(request, "password-change", 5, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa saat." },
        { status: 429 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Password lama dan baru harus diisi" },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: "Password lama salah" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: "Password berhasil diupdate" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update password" }, { status: 500 });
  }
}
