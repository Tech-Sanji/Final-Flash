// app/api/ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { messages, page } = await req.json();

  // Fetch live stats from DB
  let inventory = 0, totalOrders = 0, recentOrders = "";
  try {
    const [product, orders] = await Promise.all([
      prisma.product.findFirst({ where: { id: 1 } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    ]);
    inventory = product?.stock ?? 0;
    totalOrders = await prisma.order.count();
    recentOrders = orders.map((o) => `#${o.id} by ${o.userName}`).join(", ") || "none";
  } catch { /* fallback */ }

  const systemPrompt = `You are ARIA — the AI assistant for DropZone, a flash sale platform built for ACM MPSTME hackathon.
Current system state (live from SQLite database):
- Inventory remaining: ${inventory} units
- Units sold: ${totalOrders}
- Recent orders: ${recentOrders}
- Current page: ${page}
- Database: SQLite via Prisma ORM with atomic transactions

You help users understand:
- How to buy during the flash sale
- The inventory system (Prisma transactions prevent overselling)
- Order status and history  
- System architecture (Next.js 14, Prisma ORM, SQLite, REST APIs)
- Concurrency: Prisma $transaction with stock > 0 constraint ensures atomic operations

Be concise, friendly, and technically accurate. Keep responses under 3 sentences unless asked for technical details.`;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("No API key");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages,
      }),
    });
    const data = await res.json();
    return NextResponse.json({ reply: data.content?.[0]?.text || "Try again." });
  } catch {
    // Smart fallback
    const lastMsg = (messages[messages.length - 1]?.content || "").toLowerCase();
    let reply = "I'm ARIA, your flash sale AI assistant. Ask me about inventory, orders, or how the system works!";
    if (lastMsg.includes("stock") || lastMsg.includes("inventory"))
      reply = `Currently ${inventory} units remain. ${totalOrders} units sold so far. Stock is persisted in SQLite via Prisma.`;
    else if (lastMsg.includes("database") || lastMsg.includes("db"))
      reply = "We use SQLite as our database with Prisma ORM. Purchases use Prisma $transaction with atomic stock decrement — guaranteed no overselling.";
    else if (lastMsg.includes("buy") || lastMsg.includes("purchase"))
      reply = "Click Buy Now on the flash sale page. The backend uses a Prisma transaction to atomically check and decrement stock.";
    else if (lastMsg.includes("order"))
      reply = `${totalOrders} orders recorded in the database. Each order has a unique ID, buyer info, and precise timestamp.`;
    return NextResponse.json({ reply });
  }
}
