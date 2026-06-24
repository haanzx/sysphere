import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";
import Comment from "@/models/Comment";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";

    if (!q.trim()) {
      return NextResponse.json({ users: [], posts: [] });
    }

    const session = await auth();
    await dbConnect();

    const regex = new RegExp(q.trim(), "i");
    let users = [];
    let posts = [];

    if (type === "all" || type === "user") {
      users = await User.find({
        $or: [
          { name: regex },
          { username: regex },
        ],
      })
        .select("name username role createdAt")
        .limit(20)
        .lean();
    }

    if (type === "all" || type === "post") {
      posts = await Post.find({ content: regex })
        .sort({ createdAt: -1 })
        .populate("author", "name username role")
        .limit(50)
        .lean();

      posts = await Promise.all(
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
    }

    return NextResponse.json({ users, posts });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mencari" }, { status: 500 });
  }
}
