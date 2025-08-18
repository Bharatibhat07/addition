import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const categories = await prisma.category.findMany({
    where: { departmentId: params.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

