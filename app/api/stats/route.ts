// app/api/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [product, orders] = await Promise.all([
      prisma.product.findFirst({ where: { id: 1 } }),
      prisma.order.findMany({
        orderBy: { createdAt: "asc" },
        take: 50,
      }),
    ]);

    const initialStock = (product?.stock ?? 0) + orders.length;

    return NextResponse.json({
      inventory: product?.stock ?? 0,
      totalOrders: orders.length,
      initialStock,
      orders: orders.map((o) => ({
        id: o.id,
        product: "Gaming Console — Midnight Edition",
        price: o.price,
        userId: o.userId,
        userName: o.userName,
        time: new Date(o.createdAt).toLocaleTimeString("en-IN", { hour12: false }),
        timestamp: o.createdAt.getTime(),
      })),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ inventory: 0, totalOrders: 0, initialStock: 10, orders: [] });
  }
}
