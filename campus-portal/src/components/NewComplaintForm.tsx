"use client";
import { useEffect, useState } from "react";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  departmentId: z.string().min(1),
  categoryId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  images: z.any().optional(),
});

type Department = { id: string; name: string };
type Category = { id: string; name: string };

export default function NewComplaintForm() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then(setDepartments);
  }, []);

  async function handleDepartmentChange(deptId: string) {
    const res = await fetch(`/api/departments/${deptId}/categories`);
    if (res.ok) setCategories(await res.json());
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        departmentId: String(formData.get("departmentId") || ""),
        categoryId: String(formData.get("categoryId") || ""),
        priority: String(formData.get("priority") || "MEDIUM"),
      };
      schema.parse(payload);

      // Submit as multipart to allow future file uploads
      const res = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create complaint");
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-2xl">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm mb-1">Title</label>
        <input name="title" className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea name="description" className="w-full border rounded px-3 py-2 min-h-[120px]" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Department</label>
          <select name="departmentId" className="w-full border rounded px-3 py-2" required onChange={(e) => handleDepartmentChange(e.target.value)}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Category</label>
          <select name="categoryId" className="w-full border rounded px-3 py-2">
            <option value="">Auto-detect</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Priority</label>
          <select name="priority" className="w-full border rounded px-3 py-2">
            <option>MEDIUM</option>
            <option>LOW</option>
            <option>HIGH</option>
            <option>URGENT</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Images</label>
        <input name="images" type="file" accept="image/*" multiple />
        <p className="text-xs text-gray-500 mt-1">Optional, up to a few images.</p>
      </div>
      <button disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Submitting..." : "Submit complaint"}
      </button>
    </form>
  );
}

