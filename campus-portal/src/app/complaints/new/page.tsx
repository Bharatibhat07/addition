import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import NewComplaintForm from "@/components/NewComplaintForm";

export default async function NewComplaintPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">File a complaint</h1>
      {!session ? (
        <p className="text-sm">Please sign in to file a complaint.</p>
      ) : (
        <NewComplaintForm />
      )}
    </div>
  );
}

