// Upload file to Appwrite Storage using SSR session
// This route accepts multipart/form-data with a single `upload` file field
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/server";

export async function POST(req, context) {
  try {
    const { bucketId } = await context.params;

    // Parse multipart form
    const form = await req.formData();
    const file = form.get("upload");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size limits
    // Images: <= 3 MB, Videos: <= 10 MB
    const mime = file.type || "";
    const size = typeof file.size === 'number' ? file.size : 0;
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');
    const MAX_IMAGE = 3 * 1024 * 1024;
    const MAX_VIDEO = 10 * 1024 * 1024;

    if (isImage && size > MAX_IMAGE) {
      return NextResponse.json({ error: "Image exceeds 3MB limit" }, { status: 413 });
    }
    if (isVideo && size > MAX_VIDEO) {
      return NextResponse.json({ error: "Video exceeds 10MB limit" }, { status: 413 });
    }
    // Optional: reject unknown types or let them pass with image limit
    if (!isImage && !isVideo) {
      // For safety, enforce 3MB limit for other types
      if (size > MAX_IMAGE) {
        return NextResponse.json({ error: "File exceeds 3MB limit" }, { status: 413 });
      }
    }

    // Ensure session exists
    const { sessionExists, storage } = await createSessionClient();
    if (!sessionExists) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Appwrite expects a Blob/File; Next.js provides a File here already
    const created = await storage.createFile(bucketId, ID.unique(), file);

    // Build SSR proxied view URL for CKEditor image rendering
    const viewUrl = `/api/file/${bucketId}/${created.$id}`;

    // CKEditor UploadAdapter expects `{ url }` or `{ default }` fields
    return NextResponse.json({
      ok: true,
      fileId: created.$id,
      bucketId,
      url: viewUrl,
      default: viewUrl,
      name: created.name,
      mimeType: created.mimeType,
      sizeOriginal: created.sizeOriginal,
    });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
