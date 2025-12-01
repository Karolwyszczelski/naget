// utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
// import type { Database } from "@/lib/database.types"; // jeśli masz typy

export async function createServerSupabaseClient() {
  // W Next 15 cookies() jest async
  const cookieStore = await cookies();

  return createServerClient/* <Database> */(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // użyj ANON_KEY albo PUBLISHABLE_KEY – zależnie jak masz nazwane zmienne
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Wywołane z Server Component – nie może ustawić cookie, to ok.
            // Sesję i tak powinno odświeżać middleware.
          }
        },
      },
    }
  );
}
