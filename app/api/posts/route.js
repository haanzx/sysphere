import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";

export async function GET() {
  try {
    const session = await auth();
    await dbConnect();

    const posts = await Post.find({})
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
          isLiked: session ? post.likes?.some(
            (id) => id.toString() === session.user.id
          ) : false,
        };
      })
    );

    return NextResponse.json(postsWithCounts);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil posts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content tidak boleh kosong" },
        { status: 400 }
      );
    }

    await dbConnect();

    const post = await Post.create({
      content,
      author: session.user.id,
    });

    return NextResponse.json(
      { message: "Post berhasil dibuat", postId: post._id },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat post" }, { status: 500 });
  }
}
