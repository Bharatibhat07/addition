import Image from "next/image";

export default function Home() {
  return (
    <div className="p-8">
      <main className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">Campus Grievance Redressal Portal</h1>
        <p className="text-gray-600">File facility complaints (hostel, water, internet, security), auto-routed to the right department, with real-time tracking.</p>
        <div className="flex gap-4">
          <a className="bg-black text-white px-4 py-2 rounded" href="/complaints/new">File a complaint</a>
          <a className="border px-4 py-2 rounded" href="/dashboard">Go to dashboard</a>
        </div>
      </main>
    </div>
  );
}
