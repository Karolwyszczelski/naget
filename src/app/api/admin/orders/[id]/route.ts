import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type UiOrderStatus = "new" | "in_progress" | "done" | "cancelled";

// TAK JEST W BAZIE – enum order_status
// (kluczowa różnica: "in-progress" z myślnikiem)
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

// ---- Supabase client ----

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

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

// bezpieczne rzutowanie liczb (obsługa number/string/null)
function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

// ---- GET /api/admin/orders/[id] ----

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params; // public_id, np. NAG-XXXXXX

  try {
    // 1) pobierz zamówienie po public_id
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
      return NextResponse.json(
        { error: "Nie znaleziono zamówienia." },
        { status: 404 }
      );
    }

    // 2) pozycje z tabeli order_items
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

    const currency: string = order.currency ?? "PLN";

    const cartJson = (order.cart_json ?? null) as any | null;
    const totalsFromJson = cartJson?.totals ?? {};

    const cartTotal = toNumber(
      order.cart_total ?? totalsFromJson.cartTotal ?? 0
    );

    const deliveryTotal = toNumber(
      order.delivery_total ??
        order.delivery_final_price ??
        totalsFromJson.delivery ??
        0
    );

    const discountTotal = toNumber(
      order.discount_total ??
        order.discount_amount ??
        totalsFromJson.discount ??
        0
    );

    const totalAmount = toNumber(
      order.grand_total ??
        totalsFromJson.grandTotal ??
        cartTotal +
          deliveryTotal -
          (typeof discountTotal === "number" ? discountTotal : 0)
    );

    const detail: OrderDetail = {
      id: order.public_id,
      createdAt: order.created_at,
      status: dbToUiStatus(order.status as string | null),
      currency,
      totalAmount,
      cartTotal,
      deliveryTotal,
      discountTotal,
      customer: {
        type: order.customer_type,
        firstName: order.first_name,
        lastName: order.last_name,
        companyName: order.company_name,
        nip: order.nip,
        email: order.email,
        phone: order.phone,
        addressLine1: order.address_line1,
        addressLine2: order.address_line2,
        postalCode: order.postal_code,
        city: order.city,
        country: order.country,
      },
      delivery: {
        method: order.delivery_method,
        note: order.delivery_note,
      },
      items:
        (items ?? []).map((it: any) => ({
          id: it.id,
          productId: it.product_id,
          name: it.name,
          series: it.series,
          unitPrice: toNumber(it.unit_price),
          quantity: toNumber(it.quantity),
          config: it.config ?? {},
        })) ?? [],
      internalNote: order.notes ?? null,
      customerNote:
        order.meta?.customerNote ??
        order.meta?.customer_note ??
        cartJson?.customerNote ??
        order.delivery_note ??
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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params; // public_id

  let body: {
    status: UiOrderStatus;
    internalNote?: string | null;
    sendEmail?: boolean;
    emailMessage?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowe dane wejściowe." },
      { status: 400 }
    );
  }

  const { status, internalNote } = body;

  if (!status) {
    return NextResponse.json(
      { error: "Status jest wymagany." },
      { status: 400 }
    );
  }

  try {
    // 1) update w bazie – mapujemy na wartość ENUM
    const dbStatus = uiToDbStatus(status);

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        status: dbStatus,
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

    // 2) TODO: wysyłka maila po zmianie statusu (SMTP / inny provider)

    return NextResponse.json({
      status: dbToUiStatus(updated.status as string),
      internalNote: updated.notes ?? null,
    });
  } catch (err) {
    console.error("PATCH /api/admin/orders/[id] error", err);
    return NextResponse.json(
      { error: "Wewnętrzny błąd podczas zapisywania zmian." },
      { status: 500 }
    );
  }
}
