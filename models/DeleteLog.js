import mongoose from "mongoose";

const DeleteLogSchema = new mongoose.Schema({
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetType: {
    type: String,
    enum: ["post", "comment"],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  targetAuthor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetContent: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DeleteLog = mongoose.models.DeleteLog || mongoose.model("DeleteLog", DeleteLogSchema);

export default DeleteLog;
