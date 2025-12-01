// app/api/wishlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Brak zmiennych NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

// tylko na serwerze, z service role (ignoruje RLS)
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// na wszelki wypadek wymuszamy dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Identity = {
  userId: string | null;
  anonId: string;
  ip: string | null;
};

// identyfikacja użytkownika (na razie tylko anon_id + IP)
async function getIdentity(req: NextRequest): Promise<Identity> {
  // UWAGA: cookies() jest teraz Promise -> trzeba await
  const cookieStore = await cookies();

  let anonId = cookieStore.get("naget_wishlist_id")?.value;

  // jeśli nie ma cookie – generujemy nowe i zapisujemy
  if (!anonId) {
    anonId = crypto.randomUUID();

    cookieStore.set("naget_wishlist_id", anonId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // rok
      sameSite: "lax",
      httpOnly: false, // nie używamy go do auth po stronie serwera
    });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    // w node runtime bywa dostępne jako req.ip
    // @ts-ignore
    req.ip ??
    null;

  // tu później można podłączyć Supabase Auth i realne user_id
  const userId: string | null = null;

  return { userId, anonId, ip };
}

async function getOrCreateWishlist(identity: Identity) {
  const { userId, anonId, ip } = identity;

  const match: Record<string, any> = { anon_id: anonId };
  if (userId) match.user_id = userId;

  let { data: wishlist, error } = await supabase
    .from("wishlists")
    .select("id")
    .match(match)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!wishlist) {
    const { data, error: insertError } = await supabase
      .from("wishlists")
      .insert({
        user_id: userId,
        anon_id: anonId,
        ip,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;
    wishlist = data;
  }

  return wishlist;
}

// GET /api/wishlist  -> lista pozycji
export async function GET(req: NextRequest) {
  try {
    const identity = await getIdentity(req); // <--- WAŻNE: await
    const { userId, anonId } = identity;

    const match: Record<string, any> = { anon_id: anonId };
    if (userId) match.user_id = userId;

    const { data: wishlist, error } = await supabase
      .from("wishlists")
      .select("id")
      .match(match)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!wishlist) {
      return NextResponse.json({ items: [] });
    }

    const { data: items, error: itemsError } = await supabase
      .from("wishlist_items")
      .select("id, product_id, config")
      .eq("wishlist_id", wishlist.id);

    if (itemsError) throw itemsError;

    return NextResponse.json({
      items:
        items?.map((item) => ({
          id: item.id,
          productId: item.product_id,
          config: item.config,
        })) ?? [],
    });
  } catch (err) {
    console.error("Wishlist GET error:", err);
    return NextResponse.json(
      { items: [], error: "wishlist_get_failed" },
      { status: 500 }
    );
  }
}

// POST /api/wishlist  -> toggle / add / remove
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.productId) {
      return NextResponse.json(
        { error: "Missing productId" },
        { status: 400 }
      );
    }

    const { productId, mode = "toggle", config = null } = body as {
      productId: string;
      mode?: "toggle" | "add" | "remove";
      config?: any;
    };

    const identity = await getIdentity(req); // <--- WAŻNE: await
    const wishlist = await getOrCreateWishlist(identity);

    // sprawdzamy, czy już jest na liście
    const { data: existing, error: existingError } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("wishlist_id", wishlist.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingError) throw existingError;

    let inWishlist = !!existing;

    if (!existing && (mode === "toggle" || mode === "add")) {
      const { error: insertError } = await supabase
        .from("wishlist_items")
        .insert({
          wishlist_id: wishlist.id,
          product_id: productId,
          config,
        });

      if (insertError) throw insertError;
      inWishlist = true;
    } else if (existing && (mode === "toggle" || mode === "remove")) {
      const { error: deleteError } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", existing.id);

      if (deleteError) throw deleteError;
      inWishlist = false;
    }

    return NextResponse.json({
      ok: true,
      productId,
      inWishlist,
    });
  } catch (err) {
    console.error("Wishlist POST error:", err);
    return NextResponse.json(
      { error: "wishlist_post_failed" },
      { status: 500 }
    );
  }
}
