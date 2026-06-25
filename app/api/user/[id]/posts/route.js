import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const session = await auth();

    await dbConnect();

    const posts = await Post.find({ author: id })
      .sort({ createdAt: -1 })
      .populate("author", "name username role")
      .lean();

    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post,
          likeCount: post.likes?.length || 0,
          commentCount,
          isLiked: session
            ? post.likes?.some((id) => id.toString() === session.user.id)
            : false,
        };
      })
    );

    return NextResponse.json(postsWithCounts);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil posts" }, { status: 500 });
  }
}
