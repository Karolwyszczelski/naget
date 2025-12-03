// src/lib/adminApiAuth.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error(
    "Brak NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (adminApiAuth)."
  );
}

const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  const token = h.slice(7).trim();
  return token ? token : null;
}

async function checkAdmin(user: User): Promise<boolean> {
  // Preferuj user_id, ale wspieraj starszy schemat po emailu.
  const candidates: Array<{ col: "user_id" | "email"; value: string }> = [];

  if (user.id) candidates.push({ col: "user_id", value: user.id });
  if (user.email) candidates.push({ col: "email", value: user.email });

  for (const c of candidates) {
    const { data, error } = await serviceSupabase
      .from("admin_users")
      .select("id")
      .eq(c.col, c.value)
      .maybeSingle();

    if (error) {
      const msg = String((error as any)?.message || "");
      if (
        msg.toLowerCase().includes("column") ||
        msg.toLowerCase().includes("does not exist")
      ) {
        continue;
      }
      throw error;
    }
    if (data?.id) return true;
  }

  return false;
}

export async function requireAdmin(req: NextRequest): Promise<
  | { ok: true; user: User; supabase: typeof serviceSupabase }
  | { ok: false; res: NextResponse }
> {
  const token = bearerToken(req);

  if (!token) {
    return {
      ok: false,
      res: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  const { data, error } = await authSupabase.auth.getUser(token);
  const user = data?.user ?? null;

  if (error || !user) {
    return {
      ok: false,
      res: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  try {
    const isAdmin = await checkAdmin(user);
    if (!isAdmin) {
      return {
        ok: false,
        res: NextResponse.json({ error: "forbidden" }, { status: 403 }),
      };
    }
  } catch {
    return {
      ok: false,
      res: NextResponse.json({ error: "admin_check_failed" }, { status: 500 }),
    };
  }

  return { ok: true, user, supabase: serviceSupabase };
}
