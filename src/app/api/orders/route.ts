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
  return "NAG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { customer, delivery, discount, cart } = body;

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const anonId = cookieStore.get("naget_wishlist_id")?.value ?? null;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      // @ts-ignore
      req.ip ??
      null;

    const publicId = generatePublicId();

    const cartTotal = Number(cart.totals?.cartTotal ?? 0);
    const deliveryPrice = Number(cart.totals?.delivery ?? 0);
    const discountAmount = Number(discount?.amount ?? 0);
    const grandTotal = Number(cart.totals?.grandTotal ?? 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        public_id: publicId,
        anon_id: anonId,
        user_id: null, // docelowo: ID z Supabase Auth
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

        delivery_method: delivery?.method ?? "transport",
        delivery_base_price: delivery?.basePrice ?? deliveryPrice,
        delivery_note: delivery?.note ?? null,

        discount_code: discount?.code || null,
        discount_amount: discountAmount,

        cart_total: cartTotal,
        delivery_total: deliveryPrice,
        discount_total: discountAmount,
        grand_total: grandTotal,

        // pełne snapshoty JSON
        customer_json: customer ?? null,
        delivery_json: delivery ?? null,
        discount_json: discount ?? null,
        cart_json: cart ?? null,

        delivery_final_price: deliveryPrice, // na razie = orientacyjnie

        ip,
        user_agent: req.headers.get("user-agent"),
        source: "website",
        meta: {
          rawCustomer: customer ?? null,
          rawDelivery: delivery ?? null,
        },
      })
      .select("id, public_id")
      .single();

    if (orderError || !order) {
      console.error("orders insert error", orderError);
      return NextResponse.json(
        { error: "order_insert_failed" },
        { status: 500 }
      );
    }

    // order_items – pełne config każdego itemu, w tym dodatki
    const itemsToInsert =
      cart.items?.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        name: item.name,
        series: item.series,
        quantity: item.quantity ?? 1,
        unit_price: item.unitPrice ?? 0,
        config: item.config ?? null, // TU trafia cała konfiguracja z koszyka
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
    return NextResponse.json(
      { error: "order_post_failed" },
      { status: 500 }
    );
  }
}
