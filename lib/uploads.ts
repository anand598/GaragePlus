import { mkdir, writeFile } from "fs/promises";
import path from "path";

const uploadDir = path.join(process.cwd(), "public", "uploads");

function sanitizeBaseName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveUploadedFile(file: File, prefix: string) {
  if (!file || file.size === 0) {
    return undefined;
  }

  await mkdir(uploadDir, { recursive: true });

  const originalName = sanitizeBaseName(file.name || `${prefix}.bin`) || `${prefix}.bin`;
  const ext = path.extname(originalName) || ".bin";
  const base = path.basename(originalName, ext) || prefix;
  const filename = `${prefix}-${Date.now()}-${base}${ext}`;
  const targetPath = path.join(uploadDir, filename);
  const bytes = await file.arrayBuffer();

  await writeFile(targetPath, Buffer.from(bytes));
  return `/uploads/${filename}`;
}
