import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const departments = [
    { name: "Hostel", slug: "hostel", description: "Hostel and accommodation", escalateAfterHrs: 48 },
    { name: "Water", slug: "water", description: "Water supply and plumbing", escalateAfterHrs: 24 },
    { name: "Internet", slug: "internet", description: "Network and connectivity", escalateAfterHrs: 24 },
    { name: "Security", slug: "security", description: "Campus safety and security", escalateAfterHrs: 12 },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { slug: d.slug },
      update: d,
      create: d,
    });
  }

  const deptMap = await prisma.department.findMany();
  const bySlug: Record<string, string> = Object.fromEntries(deptMap.map((d) => [d.slug, d.id]));

  const categories = [
    { name: "Room Maintenance", slug: "room-maintenance", departmentId: bySlug["hostel"] },
    { name: "Mess/Cafeteria", slug: "mess", departmentId: bySlug["hostel"] },
    { name: "Leakage", slug: "leakage", departmentId: bySlug["water"] },
    { name: "Water Quality", slug: "water-quality", departmentId: bySlug["water"] },
    { name: "WiFi", slug: "wifi", departmentId: bySlug["internet"] },
    { name: "LAN", slug: "lan", departmentId: bySlug["internet"] },
    { name: "Gate", slug: "gate", departmentId: bySlug["security"] },
    { name: "Surveillance", slug: "surveillance", departmentId: bySlug["security"] },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }

  const password = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      email: "student@example.com",
      name: "Test Student",
      hashedPassword: password,
      role: "STUDENT",
    },
  });

  await prisma.user.upsert({
    where: { email: "agent@example.com" },
    update: {},
    create: {
      email: "agent@example.com",
      name: "Dept Agent",
      hashedPassword: password,
      role: "AGENT",
      department: { connect: { slug: "internet" } },
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Portal Admin",
      hashedPassword: password,
      role: "ADMIN",
    },
  });

  console.log("Seed complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

