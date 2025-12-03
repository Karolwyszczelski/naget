// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

function generatePublicId() {
  const id = crypto.randomUUID().split("-")[0].toUpperCase();
  return `NAG-${id}`;
}

const toMoney = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};
const toQty = (v: unknown) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 1;
};

const trimOrNull = (v: unknown, max = 200) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
};

// ====== VALIDATION (Zod) ======
const CustomerSchema = z
  .object({
    type: z.enum(["b2c", "b2b"]).optional().default("b2c"),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(5).max(30).optional().nullable(),

    companyName: z.string().trim().min(2).max(150).optional().nullable(),
    nip: z.string().trim().min(8).max(20).optional().nullable(),

    addressLine1: z.string().trim().min(2).max(160).optional().nullable(),
    addressLine2: z.string().trim().max(160).optional().nullable(),
    postalCode: z.string().trim().max(20).optional().nullable(),
    city: z.string().trim().max(80).optional().nullable(),
    country: z.string().trim().max(80).optional().nullable(),

    googlePlaceId: z.string().trim().max(200).optional().nullable(),
  })
  .superRefine((c, ctx) => {
    if (c.type === "b2b") {
      if (!c.companyName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["companyName"], message: "companyName wymagane dla b2b" });
      }
      if (!c.nip) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nip"], message: "nip wymagany dla b2b" });
      }
    }
  });

const DeliverySchema = z.object({
  method: z.string().trim().min(1).max(40).optional().default("transport"),
  basePrice: z.union([z.number(), z.string()]).optional().nullable(),
  note: z.string().trim().max(400).optional().nullable(),
});

const DiscountSchema = z.object({
  code: z.string().trim().max(60).optional().nullable(),
  amount: z.union([z.number(), z.string()]).optional().nullable(),
});

const CartItemSchema = z.object({
  productId: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(140),
  series: z.string().trim().max(80).optional().nullable(),
  quantity: z.union([z.number(), z.string()]).optional().nullable(),
  unitPrice: z.union([z.number(), z.string()]).optional().nullable(),
  config: z.unknown().optional().nullable(), // na tym etapie tylko sprawdzimy “czy to obiekt” + limit rozmiaru
});

const CartSchema = z.object({
  items: z.array(CartItemSchema).min(1).max(50),
  totals: z.any().optional(), // nie ufamy, ale można zachować do meta
});

const OrderPayloadSchema = z.object({
  customer: CustomerSchema,
  delivery: DeliverySchema.optional().default({ method: "transport" }),
  discount: DiscountSchema.optional().default({}),
  cart: CartSchema,
});

function formatZodError(err: z.ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

function ensureConfigSafe(item: any) {
  // config ma być obiektem lub null; limit rozmiaru aby nie wrzucić 5MB JSON
  if (item?.config == null) return { ok: true as const };
  if (typeof item.config !== "object") return { ok: false as const, error: "config_must_be_object" };

  const size = JSON.stringify(item.config).length;
  if (size > 80_000) return { ok: false as const, error: "config_too_large" }; // ~80KB na item
  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    if (!raw) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

    const parsed = OrderPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_failed", fields: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { customer, delivery, discount, cart } = parsed.data;

    // dodatkowe walidacje “pragmatyczne”
    for (const it of cart.items) {
      const cfg = ensureConfigSafe(it);
      if (!cfg.ok) {
        return NextResponse.json({ error: cfg.error, productId: it.productId }, { status: 400 });
      }
    }

    const cookieStore = await cookies();
    const anonId =
      cookieStore.get("naget_anon_id")?.value ??
      cookieStore.get("naget_wishlist_id")?.value ??
      null;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip")?.trim() ??
      null;

    const publicId = generatePublicId();

    // totals liczone backendem (spójność)
    const cartTotal = cart.items.reduce((sum, it) => {
      const qty = toQty(it.quantity);
      const unit = toMoney(it.unitPrice);
      return sum + qty * unit;
    }, 0);

    const deliveryMethod = delivery?.method ?? "transport";
    const deliveryPrice = deliveryMethod === "transport" ? toMoney(delivery?.basePrice) : 0;

    // clamp discount, żeby nie zrobić ujemnych kwot
    const discountAmountRaw = toMoney(discount?.amount);
    const maxDiscount = cartTotal + deliveryPrice;
    const discountAmount = Math.min(discountAmountRaw, maxDiscount);

    const grandTotal = Math.max(0, cartTotal + deliveryPrice - discountAmount);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        public_id: publicId,
        anon_id: anonId,
        user_id: null,
        status: "new",
        currency: "PLN",

        customer_type: customer.type ?? "b2c",
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: trimOrNull(customer.phone, 30),

        company_name: trimOrNull(customer.companyName, 150),
        nip: trimOrNull(customer.nip, 20),

        address_line1: trimOrNull(customer.addressLine1, 160),
        address_line2: trimOrNull(customer.addressLine2, 160),
        postal_code: trimOrNull(customer.postalCode, 20),
        city: trimOrNull(customer.city, 80),
        country: trimOrNull(customer.country, 80),
        google_place_id: trimOrNull(customer.googlePlaceId, 200),

        delivery_method: deliveryMethod,
        delivery_base_price: toMoney(delivery?.basePrice),
        delivery_note: trimOrNull(delivery?.note, 400),

        discount_code: trimOrNull(discount?.code, 60),
        discount_amount: discountAmount,

        cart_total: cartTotal,
        delivery_total: deliveryPrice,
        discount_total: discountAmount,
        grand_total: grandTotal,

        customer_json: customer ?? null,
        delivery_json: delivery ?? null,
        discount_json: discount ?? null,
        cart_json: cart ?? null,

        delivery_final_price: deliveryPrice,

        ip,
        user_agent: req.headers.get("user-agent"),
        source: "website",
        meta: {
          clientTotals: (raw as any)?.cart?.totals ?? null,
          totalsComputed: { cartTotal, deliveryPrice, discountAmount, grandTotal },
        },
      })
      .select("id, public_id")
      .single();

    if (orderError || !order) {
      console.error("orders insert error", orderError);
      return NextResponse.json({ error: "order_insert_failed" }, { status: 500 });
    }

    const itemsToInsert = cart.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      name: item.name,
      series: item.series ?? null,
      quantity: toQty(item.quantity),
      unit_price: toMoney(item.unitPrice),
      config: item.config ?? null,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);
    if (itemsError) {
      console.error("order_items insert error", itemsError);
      return NextResponse.json({ error: "order_items_insert_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, publicId: order.public_id });
  } catch (error) {
    console.error("Order POST fatal error", error);
    return NextResponse.json({ error: "order_post_failed" }, { status: 500 });
  }
}
