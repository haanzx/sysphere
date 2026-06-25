import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import { applyRateLimit } from "@/lib/rateLimit";
import { validatePostContent, validateMedia } from "@/lib/validation";

export async function GET() {
  try {
    const session = await auth();
    await dbConnect();

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate("author", "name username role isActive")
      .lean();

    const activePosts = posts.filter((post) => post.author?.isActive !== false);

    const postsWithCounts = await Promise.all(
      activePosts.map(async (post) => {
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

    const rateLimitResult = applyRateLimit(request, "create-post", 10, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak request. Coba lagi dalam beberapa saat." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { content, media } = body;

    const hasContent = content && content.trim().length > 0;
    const hasMedia = media && media.url && media.type;

    if (!hasContent && !hasMedia) {
      return NextResponse.json(
        { error: "Postingan harus memiliki konten atau gambar/video" },
        { status: 400 }
      );
    }

    if (content) {
      const contentValidation = validatePostContent(content);
      if (!contentValidation.valid) {
        return NextResponse.json({ error: contentValidation.error }, { status: 400 });
      }
    }

    if (media) {
      const mediaValidation = validateMedia(media);
      if (!mediaValidation.valid) {
        return NextResponse.json({ error: mediaValidation.error }, { status: 400 });
      }
    }

    await dbConnect();

    const postData = {
      content: content?.trim() || "",
      author: session.user.id,
    };

    if (hasMedia) {
      postData.media = {
        url: media.url,
        type: media.type,
        publicId: media.publicId || "",
      };
    }

    const post = await Post.create(postData);

    return NextResponse.json(
      { message: "Post berhasil dibuat", postId: post._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Gagal membuat post" }, { status: 500 });
  }
}
