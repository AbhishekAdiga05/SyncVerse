import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  ownerId: {
    type: String, // From Clerk user.id
    required: false
  },
  name: {
    type: String,
    default: "Untitled Workspace"
  },
  language: {
    type: String,
    default: "javascript"
  },
  code: {
    type: String,
    default: "// Start coding collaboratively here..."
  },
  ydocState: {
    type: Buffer,
    default: null,
  },
},
{
    timestamps: true
});

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;   