// app/api/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { amount } = await req.json().catch(() => ({ amount: 10 }));
  const stock = amount || 10;

  try {
    await prisma.$transaction([
      // Clear all orders
      prisma.order.deleteMany(),
      // Reset stock
      prisma.product.update({
        where: { id: 1 },
        data: { stock },
      }),
    ]);

    return NextResponse.json({ success: true, inventory: stock });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ success: false, message: "Reset failed" }, { status: 500 });
  }
}
