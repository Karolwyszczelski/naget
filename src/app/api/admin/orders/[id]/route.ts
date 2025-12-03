import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApiAuth";

export const runtime = "nodejs";

type UiOrderStatus = "new" | "in_progress" | "done" | "cancelled";

// enum w DB: "in-progress"
type DbOrderStatus = "new" | "in-progress" | "done" | "cancelled";

type OrderItem = {
  id: string;
  productId: string;
  name: string;
  series: string;
  unitPrice: number;
  quantity: number;
  config: any;
};

type OrderDetail = {
  id: string;
  createdAt: string;
  status: UiOrderStatus;
  currency: string;
  totalAmount: number;
  cartTotal: number;
  deliveryTotal: number;
  discountTotal: number;
  customer: {
    type: string | null;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    nip: string | null;
    email: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
  };
  delivery: {
    method: string | null;
    note: string | null;
  };
  items: OrderItem[];
  internalNote: string | null;
  customerNote: string | null;
};

// ---- mapowanie statusów ----

function dbToUiStatus(status: string | null): UiOrderStatus {
  if (!status) return "new";
  if (status === "in-progress") return "in_progress";
  if (status === "done") return "done";
  if (status === "cancelled") return "cancelled";
  return "new";
}

function uiToDbStatus(status: UiOrderStatus): DbOrderStatus {
  if (status === "in_progress") return "in-progress";
  return status;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function toQty(value: unknown): number {
  const n = Math.floor(toNumber(value, 1));
  return n > 0 ? n : 1;
}

// ---- GET /api/admin/orders/[id] ----

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const supabase = auth.supabase;

  const { id } = await ctx.params; // public_id, np. NAG-XXXXXX

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        public_id,
        created_at,
        status,
        currency,
        notes,
        meta,
        customer_type,
        first_name,
        last_name,
        company_name,
        nip,
        email,
        phone,
        address_line1,
        address_line2,
        postal_code,
        city,
        country,
        delivery_method,
        delivery_note,
        delivery_base_price,
        delivery_total,
        delivery_final_price,
        discount_code,
        discount_amount,
        discount_total,
        cart_total,
        grand_total,
        cart_json,
        customer_json,
        delivery_json
      `
      )
      .eq("public_id", id)
      .single();

    if (orderError || !order) {
      console.error("GET order error", orderError);
      return NextResponse.json({ error: "Nie znaleziono zamówienia." }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        id,
        order_id,
        product_id,
        name,
        series,
        unit_price,
        quantity,
        config,
        created_at
      `
      )
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("GET order items error", itemsError);
      return NextResponse.json(
        { error: "Błąd podczas pobierania pozycji zamówienia." },
        { status: 500 }
      );
    }

    const currency: string = (order as any).currency ?? "PLN";

    const cartJson = ((order as any).cart_json ?? null) as any | null;
    const totalsFromJson = (cartJson?.totals ?? {}) as any;
    const meta = (((order as any).meta ?? null) as any) ?? {};

    const cartTotal = toNumber((order as any).cart_total ?? totalsFromJson.cartTotal ?? 0);

    const deliveryTotal = toNumber(
      (order as any).delivery_total ??
        (order as any).delivery_final_price ??
        totalsFromJson.delivery ??
        0
    );

    const discountTotal = toNumber(
      (order as any).discount_total ??
        (order as any).discount_amount ??
        totalsFromJson.discount ??
        0
    );

    const totalAmount = toNumber(
      (order as any).grand_total ??
        totalsFromJson.grandTotal ??
        Math.max(0, cartTotal + deliveryTotal - discountTotal)
    );

    const detail: OrderDetail = {
      id: (order as any).public_id,
      createdAt: (order as any).created_at,
      status: dbToUiStatus((order as any).status as string | null),
      currency,
      totalAmount,
      cartTotal,
      deliveryTotal,
      discountTotal,
      customer: {
        type: (order as any).customer_type ?? null,
        firstName: (order as any).first_name ?? null,
        lastName: (order as any).last_name ?? null,
        companyName: (order as any).company_name ?? null,
        nip: (order as any).nip ?? null,
        email: (order as any).email ?? null,
        phone: (order as any).phone ?? null,
        addressLine1: (order as any).address_line1 ?? null,
        addressLine2: (order as any).address_line2 ?? null,
        postalCode: (order as any).postal_code ?? null,
        city: (order as any).city ?? null,
        country: (order as any).country ?? null,
      },
      delivery: {
        method: (order as any).delivery_method ?? null,
        note: (order as any).delivery_note ?? null,
      },
      items: (items ?? []).map((it: any) => ({
        id: it.id,
        productId: it.product_id,
        name: it.name,
        series: it.series,
        unitPrice: toNumber(it.unit_price),
        quantity: toQty(it.quantity),
        config: it.config ?? {},
      })),
      internalNote: (order as any).notes ?? null,
      customerNote:
        meta?.customerNote ??
        meta?.customer_note ??
        cartJson?.customerNote ??
        (order as any).delivery_note ??
        null,
    };

    return NextResponse.json({ order: detail });
  } catch (err) {
    console.error("GET /api/admin/orders/[id] error", err);
    return NextResponse.json(
      { error: "Wewnętrzny błąd podczas pobierania zamówienia." },
      { status: 500 }
    );
  }
}

// ---- PATCH /api/admin/orders/[id] ----

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const supabase = auth.supabase;

  const { id } = await ctx.params;

  let body: {
    status: UiOrderStatus;
    internalNote?: string | null;
    sendEmail?: boolean;
    emailMessage?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane wejściowe." }, { status: 400 });
  }

  const { status, internalNote } = body;

  if (!status || !["new", "in_progress", "done", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Status jest wymagany." }, { status: 400 });
  }

  try {
    const dbStatus = uiToDbStatus(status);

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        status: dbStatus as DbOrderStatus,
        notes: internalNote ?? null,
      })
      .eq("public_id", id)
      .select("status, notes")
      .single();

    if (updateError || !updated) {
      console.error("PATCH update error:", updateError);
      return NextResponse.json(
        { error: "Nie udało się zaktualizować zamówienia." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: dbToUiStatus((updated as any).status as string),
      internalNote: (updated as any).notes ?? null,
    });
  } catch (err) {
    console.error("PATCH /api/admin/orders/[id] error", err);
    return NextResponse.json(
      { error: "Wewnętrzny błąd podczas zapisywania zmian." },
      { status: 500 }
    );
  }
}
