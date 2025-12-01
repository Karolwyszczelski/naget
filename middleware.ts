// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // bazowa odpowiedź, na której Supabase będzie aktualizował cookies
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // użyj tego, co masz w env: ANON / PUBLISHABLE key
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // aktualizacja cookies w obiekcie request
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          );

          // tworzymy nową odpowiedź z odświeżonymi cookies
          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // WAŻNE: nic pomiędzy createServerClient a auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  // middleware interesuje nas tylko na /admin/*
  if (!isAdminRoute) {
    return supabaseResponse;
  }

  // 1) Brak usera – wpuszczamy tylko na /admin/login
  if (!user) {
    if (!isLoginRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("redirectTo", pathname);

      const redirectResponse = NextResponse.redirect(redirectUrl);
      // kopiujemy cookies z supabaseResponse (żeby sesja się nie rozjechała)
      redirectResponse.cookies.setAll(supabaseResponse.cookies.getAll());
      return redirectResponse;
    }

    // /admin/login bez sesji – pokazujemy login, ale cookies już są odświeżone
    return supabaseResponse;
  }

  // 2) Jest user – sprawdzamy, czy jest adminem
  const { data: admins, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  const isAdmin =
    !adminError && Array.isArray(admins) && admins.length > 0;

  // 2a) Nie-admin próbuje wejść na /admin/*
  if (!isAdmin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("adminError", "no-permission");

    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.setAll(supabaseResponse.cookies.getAll());
    return redirectResponse;
  }

  // 2b) Admin wchodzi na /admin/login – przekieruj do /admin/orders
  if (isLoginRoute && isAdmin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/orders";
    redirectUrl.searchParams.delete("redirectTo");

    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.setAll(supabaseResponse.cookies.getAll());
    return redirectResponse;
  }

  // 3) Admin + dowolny inny /admin/... – przepuszczamy
  return supabaseResponse;
}

// middleware uruchamia się tylko dla /admin/*
export const config = {
  matcher: ["/admin/:path*"],
};
