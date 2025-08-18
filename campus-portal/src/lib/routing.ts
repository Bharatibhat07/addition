import { prisma } from "@/lib/prisma";

export type RoutingInput = {
  departmentId: string;
  title: string;
  description: string;
};

const KEYWORDS: Record<string, string[]> = {
  "room-maintenance": ["room", "hostel", "maintenance", "fan", "light", "ac", "bed", "door", "window"],
  "mess": ["mess", "cafeteria", "food", "canteen", "meal", "hygiene", "breakfast", "lunch"],
  "leakage": ["leak", "leakage", "pipe", "plumbing", "tap", "drip", "burst"],
  "water-quality": ["water", "quality", "dirty", "smell", "taste", "contamination"],
  "wifi": ["wifi", "wi-fi", "wireless", "internet", "slow", "disconnect"],
  "lan": ["lan", "ethernet", "wired", "port"],
  "gate": ["gate", "entry", "exit", "parking", "guard"],
  "surveillance": ["cctv", "camera", "surveillance", "monitor", "security"],
};

export async function predictCategoryId({ departmentId, title, description }: RoutingInput): Promise<{ categoryId: string | null; confidence: number | null }> {
  const categories = await prisma.category.findMany({ where: { departmentId } });
  if (categories.length === 0) return { categoryId: null, confidence: null };

  const text = `${title} ${description}`.toLowerCase();
  let best: { id: string; score: number } | null = null;
  for (const c of categories) {
    const words = KEYWORDS[c.slug] ?? [];
    const score = words.reduce((acc, w) => (text.includes(w) ? acc + 1 : acc), 0);
    if (!best || score > best.score) best = { id: c.id, score };
  }
  if (!best || best.score === 0) return { categoryId: null, confidence: 0 };
  const confidence = Math.min(0.9, 0.4 + best.score * 0.15);
  return { categoryId: best.id, confidence };
}

