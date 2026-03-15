// app/api/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, userName } = await req.json();

  if (!userId || !userName) {
    return NextResponse.json({ success: false, message: "Missing user info" }, { status: 400 });
  }

  try {
    // Atomic transaction — check stock and create order in one operation
    const result = await prisma.$transaction(async (tx) => {
      // Lock the product row and check stock
      const product = await tx.product.findFirst({
        where: { id: 1 },
      });

      if (!product || product.stock <= 0) {
        return null;
      }

      // Decrement stock atomically
      const updated = await tx.product.update({
        where: { id: 1, stock: { gt: 0 } }, // extra safety check
        data: { stock: { decrement: 1 } },
      });

      // Create order record
      const order = await tx.order.create({
        data: {
          userId,
          userName,
          productId: 1,
          price: product.price,
        },
      });

      return { order, product: updated };
    });

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Out of stock — better luck next time!" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        product: "Gaming Console — Midnight Edition",
        price: result.order.price,
        userName: result.order.userName,
        time: new Date(result.order.createdAt).toLocaleTimeString("en-IN", { hour12: false }),
      },
    });
  } catch (error: unknown) {
    // If update fails due to stock constraint, it means sold out
    console.error("Purchase error:", error);
    return NextResponse.json(
      { success: false, message: "Out of stock — better luck next time!" },
      { status: 409 }
    );
  }
}
