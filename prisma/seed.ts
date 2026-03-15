// prisma/seed.ts
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Seed users
  await prisma.user.createMany({
    data: [
      { name: "Demo User", email: "demo@dropzone.io", password: "drop2024", role: "user" },
      { name: "Admin", email: "admin@dropzone.io", password: "admin2024", role: "admin" },
      { name: "Judge", email: "judge@hackathon.io", password: "judge2024", role: "judge" },
    ],
  });

  // Seed product
  await prisma.product.create({
    data: {
      name: "Gaming Console — Midnight Edition",
      price: 29999,
      stock: 10,
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
