// Universal Appwrite Storage SSR Proxy
// Securely serves files through server-side session without exposing credentials to client
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Client, Storage } from "node-appwrite";

export async function GET(req, context) {
    try {
        // Verify user session for authorization
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("messuopas-session");

        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { bucketId, fileId } = await context.params;

        // Initialize Appwrite client with API key only (no session for metadata)
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);
        const storage = new Storage(client);

        // Get file metadata for proper Content-Type
        const fileMetadata = await storage.getFile(bucketId, fileId);
        console.log('🔍 File metadata from Appwrite:', {
            name: fileMetadata?.name,
            mimeType: fileMetadata?.mimeType,
            size: fileMetadata?.sizeOriginal,
            bucketId: fileMetadata?.bucketId,
            fileId: fileMetadata?.$id
        });
        
        const contentType = fileMetadata?.mimeType || "application/octet-stream";
        const fileName = fileMetadata?.name || "file";

        // Use view endpoint with session cookie - this should work for SVG
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        
        const viewUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
        
        console.log('🌐 Fetching from URL:', viewUrl);
        console.log('📋 Request headers:', {
            'X-Appwrite-Project': projectId,
            'Cookie': `a_session_${projectId}=${sessionCookie.value}`,
        });
        
        const fileResponse = await fetch(viewUrl, {
            headers: {
                'X-Appwrite-Project': projectId,
                'Cookie': `a_session_${projectId}=${sessionCookie.value}`,
            }
        });
        
        console.log('📥 Response status:', fileResponse.status);
        console.log('📥 Response headers:', Object.fromEntries(fileResponse.headers.entries()));
        
        if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            console.log('❌ Error response body:', errorText);
            throw new Error(`Failed to fetch file: ${fileResponse.status} - ${errorText}`);
        }
        
        const fileBuffer = await fileResponse.arrayBuffer();
        console.log('📦 File buffer size:', fileBuffer.byteLength);
        
        // Log first few bytes to see what we're getting
        const firstBytes = new Uint8Array(fileBuffer.slice(0, 100));
        const firstBytesString = Array.from(firstBytes).map(b => String.fromCharCode(b)).join('');
        console.log('🔍 First 100 bytes as string:', firstBytesString.substring(0, 100));
        console.log('🔍 First 20 bytes as hex:', Array.from(firstBytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));

        // Return file with proper headers for caching and inline display
        return new Response(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${fileName}"`,
                // Aggressive caching since files rarely change
                "Cache-Control": "public, max-age=31536000, immutable",
                // Security headers
                "X-Content-Type-Options": "nosniff",
                // ETag for conditional requests
                "ETag": `"${fileId}"`,
            },
        });
    } catch (error) {
        console.error("Storage proxy error:", error);
        
        // Handle specific Appwrite errors
        if (error.code === 404) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
        if (error.code === 401) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }
        
        return NextResponse.json({ error: "Storage error" }, { status: 500 });
    }
}

export async function DELETE(req, context) {
  try {
    // Verify user session for authorization
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("messuopas-session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bucketId, fileId } = await context.params;

    // Initialize Appwrite client with API key
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const storage = new Storage(client);

    await storage.deleteFile(bucketId, fileId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Storage delete error:", error);
    if (error.code === 404) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (error.code === 401) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
}
