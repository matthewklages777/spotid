import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";
import { rateLimit, getIp } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// ── R2 / S3 helper ────────────────────────────────────────────────────────────
// Cloudflare R2 is S3-compatible, so we use @aws-sdk/client-s3 with a custom
// endpoint. If the R2 env vars are not set we fall back to local disk (dev only).

function r2Configured() {
  return !!(
    process.env["R2_ACCOUNT_ID"] &&
    process.env["R2_ACCESS_KEY_ID"] &&
    process.env["R2_SECRET_ACCESS_KEY"] &&
    process.env["R2_BUCKET_NAME"]
  );
}

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const accountId = process.env["R2_ACCOUNT_ID"]!;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env["R2_ACCESS_KEY_ID"]!,
      secretAccessKey: process.env["R2_SECRET_ACCESS_KEY"]!,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env["R2_BUCKET_NAME"]!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Objects are public-readable via the R2 custom domain
      ACL: "public-read",
    })
  );

  // R2_PUBLIC_URL is your bucket's public URL, e.g. https://assets.spotidapp.com
  const publicBase = (process.env["R2_PUBLIC_URL"] ?? "").replace(/\/$/, "");
  return `${publicBase}/${key}`;
}

async function uploadToLocalDisk(buffer: Buffer, filename: string): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;

  if (!rateLimit(`upload:${userId}:${getIp(req)}`, 20, 60 * 60 * 1000)) {
    return Response.json({ error: "Upload limit reached. Please try again later." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, WebP, GIF, and AVIF images are allowed." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Response.json(
      { error: `Image must be under ${MAX_SIZE_MB}MB.` },
      { status: 400 }
    );
  }

  const ext = EXT_MAP[file.type] ?? "jpg";
  // Namespace uploads by user so they're easy to audit / purge
  const key = `uploads/${userId}/${randomUUID()}.${ext}`;
  const filename = key.split("/").pop()!;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let url: string;

    if (r2Configured()) {
      url = await uploadToR2(buffer, key, file.type);
    } else {
      // Dev fallback — local disk
      console.warn("[upload] R2 not configured — writing to local disk (dev only)");
      url = await uploadToLocalDisk(buffer, filename);
    }

    return Response.json({ url });
  } catch (err) {
    console.error("[upload] Failed:", err);
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
