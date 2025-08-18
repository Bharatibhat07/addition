import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  let complaints: any[] = [];
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (dbUser) {
      complaints = await prisma.complaint.findMany({
        where: { createdById: dbUser.id },
        include: { department: true, category: true },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/complaints/new" className="bg-black text-white px-4 py-2 rounded">New complaint</Link>
      </div>
      {!session && (
        <div className="text-sm">
          You are not signed in. <Link className="underline" href="/login">Sign in</Link>
        </div>
      )}
      {session && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Signed in as {session.user?.email}</p>
          <p className="text-sm">Role: {(session as any).role}</p>
        </div>
      )}
      <div className="border rounded p-4">
        <h2 className="font-medium mb-3">My complaints</h2>
        {complaints.length === 0 && <p className="text-sm text-gray-600">No complaints yet.</p>}
        <ul className="divide-y">
          {complaints.map((c) => (
            <li key={c.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-gray-600">{c.department.name} {c.category ? `• ${c.category.name}` : ""}</div>
              </div>
              <span className="text-xs rounded px-2 py-1 border">{c.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}