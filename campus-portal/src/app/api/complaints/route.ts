import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { z } from "zod";
import { predictCategoryId } from "@/lib/routing";
import fs from "node:fs/promises";
import path from "node:path";

const CreateComplaintSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  departmentId: z.string(),
  categoryId: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

// Simple heuristic routing: if category not provided, pick top category of that department
async function autoRouteCategory(departmentId: string) {
  const category = await prisma.category.findFirst({
    where: { departmentId },
    orderBy: { name: "asc" },
  });
  return category?.id ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const complaints = await prisma.complaint.findMany({
    where: { createdById: user.id },
    include: { department: true, category: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(complaints);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let payload: z.infer<typeof CreateComplaintSchema>;
  let files: File[] = [];
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    payload = {
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      departmentId: String(form.get("departmentId") || ""),
      categoryId: String(form.get("categoryId") || ""),
      priority: String(form.get("priority") || "MEDIUM") as any,
    };
    files = form.getAll("images").filter((f): f is File => f instanceof File);
  } else {
    const body = await req.json();
    payload = body;
  }

  const parsed = CreateComplaintSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { title, description, departmentId, categoryId, priority } = parsed.data;

  let finalCategoryId: string | null = null;
  let routingConfidence: number | null = null;
  if (categoryId && categoryId.length > 0) {
    finalCategoryId = categoryId;
  } else {
    const predicted = await predictCategoryId({ departmentId, title, description });
    finalCategoryId = predicted.categoryId;
    routingConfidence = predicted.confidence;
  }

  const complaint = await prisma.complaint.create({
    data: {
      title,
      description,
      departmentId,
      categoryId: finalCategoryId,
      createdById: user.id,
      priority,
      autoRouted: !categoryId,
      routingConfidence,
      updates: {
        create: [{ message: "Complaint created", type: "SYSTEM" }],
      },
    },
  });

  // Save file uploads to public/uploads and create attachments
  if (files.length > 0) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const attachments = [] as { url: string; mimeType: string | null; sizeBytes: number | null }[];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = path.extname(file.name || "").replace(".", "") || "bin";
      const filename = `${complaint.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const dest = path.join(uploadsDir, filename);
      await fs.writeFile(dest, buffer);
      attachments.push({ url: `/uploads/${filename}`, mimeType: file.type || null, sizeBytes: buffer.length });
    }
    if (attachments.length > 0) {
      await prisma.attachment.createMany({
        data: attachments.map((a) => ({ ...a, complaintId: complaint.id } as any)),
      });
    }
  }

  const withRelations = await prisma.complaint.findUnique({
    where: { id: complaint.id },
    include: { attachments: true, department: true, category: true },
  });
  return NextResponse.json(withRelations, { status: 201 });
}

