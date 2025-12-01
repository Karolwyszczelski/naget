// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type OrderStatus = "new" | "in_progress" | "done" | "cancelled";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY dla admin API."
  );
}

// Jeden klient admina na cały proces
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return 0;
}

export async function GET(_req: NextRequest) {
  try {
    // 1) Zamówienia
    const { data: orderRows, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        public_id,
        created_at,
        first_name,
        last_name,
        email,
        status,
        grand_total,
        notes
      `
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (ordersError) {
      console.error("Admin orders list error:", ordersError);
      return NextResponse.json(
        { error: "Nie udało się pobrać zamówień." },
        { status: 500 }
      );
    }

    // 2) Ilość pozycji per zamówienie
    const { data: itemRows, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id, quantity");

    if (itemsError) {
      console.error("Admin orders items error:", itemsError);
      return NextResponse.json(
        { error: "Nie udało się pobrać pozycji zamówień." },
        { status: 500 }
      );
    }

    const itemsCountByOrderId = new Map<string, number>();
    (itemRows ?? []).forEach((row: any) => {
      const orderId = row.order_id as string;
      const qty = Number(row.quantity ?? 0);
      itemsCountByOrderId.set(orderId, (itemsCountByOrderId.get(orderId) ?? 0) + qty);
    });

    const orders = (orderRows ?? []).map((row: any) => {
      const fullName = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
      const customerName = fullName || row.email || "—";

      return {
        id: row.public_id as string, // używamy public_id jako ID w panelu
        createdAt: row.created_at as string,
        customerName,
        totalAmount: parseNumber(row.grand_total),
        status: row.status as OrderStatus,
        itemsCount: itemsCountByOrderId.get(row.id) ?? 0,
        note: row.notes as string | null,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders list unexpected error:", error);
    return NextResponse.json(
      { error: "Nieoczekiwany błąd podczas pobierania zamówień." },
      { status: 500 }
    );
  }
}
