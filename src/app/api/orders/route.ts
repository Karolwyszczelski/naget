// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

function generatePublicId() {
  // mniejsze ryzyko kolizji niż Math.random()
  const id = crypto.randomUUID().split("-")[0].toUpperCase();
  return `NAG-${id}`;
}

const toNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toMoney = (v: any) => Math.max(0, toNumber(v));
const toQty = (v: any) => {
  const n = Math.floor(toNumber(v));
  return n > 0 ? n : 1;
};

const isEmail = (v: any) =>
  typeof v === "string" && v.includes("@") && v.length <= 254;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const { customer, delivery, discount, cart } = body;

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return NextResponse.json({ error: "cart_empty" }, { status: 400 });
    }

    // Minimalna walidacja danych klienta (bez lania wody)
    if (!customer || typeof customer !== "object") {
      return NextResponse.json({ error: "customer_required" }, { status: 400 });
    }
    if (!isEmail(customer.email)) {
      return NextResponse.json({ error: "email_required" }, { status: 400 });
    }
    if (typeof customer.firstName !== "string" || customer.firstName.trim().length < 1) {
      return NextResponse.json({ error: "first_name_required" }, { status: 400 });
    }
    if (typeof customer.lastName !== "string" || customer.lastName.trim().length < 1) {
      return NextResponse.json({ error: "last_name_required" }, { status: 400 });
    }

    const cookieStore = await cookies();

    // POPRAWKA: anon_id (z fallbackiem do starej nazwy, żeby nie rozbić istniejących sesji)
    const anonId =
      cookieStore.get("naget_anon_id")?.value ??
      cookieStore.get("naget_wishlist_id")?.value ??
      null;

    // Next 15: req.ip usunięte — bierzemy z nagłówków reverse proxy (Vercel/CF/Nginx)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip")?.trim() ??
      null;

    const publicId = generatePublicId();

    // 1) Totale liczone backendem z pozycji (spójność)
    const safeItems = cart.items;
    const cartTotal = safeItems.reduce((sum: number, item: any) => {
      const qty = toQty(item?.quantity);
      const unit = toMoney(item?.unitPrice);
      return sum + qty * unit;
    }, 0);

    // 2) Delivery liczone backendem (na razie z delivery.basePrice; docelowo z cennika serwerowego)
    const deliveryMethod = (delivery?.method ?? "transport") as string;
    const deliveryPrice =
      deliveryMethod === "transport" ? toMoney(delivery?.basePrice) : 0;

    // 3) Discount (na razie z payloadu; docelowo po stronie serwera po kodzie)
    const discountAmount = toMoney(discount?.amount);
    const grandTotal = Math.max(0, cartTotal + deliveryPrice - discountAmount);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        public_id: publicId,
        anon_id: anonId,
        user_id: null,
        status: "new",
        currency: "PLN",

        customer_type: customer?.type ?? "b2c",
        first_name: customer?.firstName ?? null,
        last_name: customer?.lastName ?? null,
        email: customer?.email ?? null,
        phone: customer?.phone ?? null,
        company_name: customer?.companyName || null,
        nip: customer?.nip || null,

        address_line1: customer?.addressLine1 ?? null,
        address_line2: customer?.addressLine2 || null,
        postal_code: customer?.postalCode ?? null,
        city: customer?.city ?? null,
        country: customer?.country ?? null,
        google_place_id: customer?.googlePlaceId ?? null,

        delivery_method: deliveryMethod,
        delivery_base_price: toMoney(delivery?.basePrice),
        delivery_note: delivery?.note ?? null,

        discount_code: discount?.code || null,
        discount_amount: discountAmount,

        // IMPORTANT: zapisujemy policzone total-e (nie zaufane z frontu)
        cart_total: cartTotal,
        delivery_total: deliveryPrice,
        discount_total: discountAmount,
        grand_total: grandTotal,

        // snapshoty JSON
        customer_json: customer ?? null,
        delivery_json: delivery ?? null,
        discount_json: discount ?? null,
        cart_json: cart ?? null,

        delivery_final_price: deliveryPrice,

        ip,
        user_agent: req.headers.get("user-agent"),
        source: "website",
        meta: {
          clientTotals: cart?.totals ?? null,
          totalsComputed: { cartTotal, deliveryPrice, discountAmount, grandTotal },
        },
      })
      .select("id, public_id")
      .single();

    if (orderError || !order) {
      console.error("orders insert error", orderError);
      return NextResponse.json({ error: "order_insert_failed" }, { status: 500 });
    }

    const itemsToInsert =
      safeItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        name: item.name,
        series: item.series,
        quantity: toQty(item.quantity),
        unit_price: toMoney(item.unitPrice),
        config: item.config ?? null,
      })) ?? [];

    if (itemsToInsert.length) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("order_items insert error", itemsError);
        return NextResponse.json(
          { error: "order_items_insert_failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      publicId: order.public_id,
    });
  } catch (error) {
    console.error("Order POST fatal error", error);
    return NextResponse.json({ error: "order_post_failed" }, { status: 500 });
  }
}
