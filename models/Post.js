import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    maxlength: 5000,
    default: "",
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  media: {
    url: { type: String, default: "" },
    type: { type: String, enum: ["image", "video", ""], default: "" },
    publicId: { type: String, default: "" },
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

export default Post;
