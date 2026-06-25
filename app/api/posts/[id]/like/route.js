import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import Notification from "@/models/Notification";

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
    }

    const userId = session.user.id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);

      if (post.author.toString() !== userId) {
        await Notification.create({
          user: post.author,
          from: userId,
          type: "like",
          post: post._id,
        });
      }
    }

    await post.save();

    return NextResponse.json({
      liked: !isLiked,
      count: post.likes.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal toggle like" }, { status: 500 });
  }
}
