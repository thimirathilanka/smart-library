import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMemberById } from "@/lib/data/members";
import { createCloudinaryUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await getMemberById(session.user.id);
  const isAuthorized = member && member.status === "Active" && (member.isAdmin || member.isAuthor);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden. Only active admins and authors can upload." }, { status: 403 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const signatureData = createCloudinaryUploadSignature("smart-library/pdfs");
  if (!signatureData) {
    return NextResponse.json({ configured: false, error: "Cloudinary configuration incomplete." });
  }

  return NextResponse.json({
    configured: true,
    ...signatureData,
  });
}

