// middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // bazowa odpowiedź, na której Supabase będzie aktualizował cookies
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Supabase oczekuje tablicy { name, value }
        getAll() {
          return request.cookies
            .getAll()
            .map(({ name, value }) => ({ name, value }));
        },
        // wszystkie nowe/odświeżone ciasteczka zapisujemy WYŁĄCZNIE na response
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
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
    return response;
  }

  // helper do kopiowania cookies na odpowiedź przekierowującą
  const withCopiedCookies = (res: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value);
    });
    return res;
  };

  // 1) Brak usera – wpuszczamy tylko na /admin/login
  if (!user) {
    if (!isLoginRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("redirectTo", pathname);

      const redirectResponse = NextResponse.redirect(redirectUrl);
      return withCopiedCookies(redirectResponse);
    }

    // /admin/login bez sesji – pokazujemy login, ale cookies już są odświeżone
    return response;
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
    return withCopiedCookies(redirectResponse);
  }

  // 2b) Admin wchodzi na /admin/login – przekieruj do /admin/orders
  if (isLoginRoute && isAdmin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/orders";
    redirectUrl.searchParams.delete("redirectTo");

    const redirectResponse = NextResponse.redirect(redirectUrl);
    return withCopiedCookies(redirectResponse);
  }

  // 3) Admin + dowolny inny /admin/... – przepuszczamy
  return response;
}

// middleware uruchamia się tylko dla /admin/*
export const config = {
  matcher: ["/admin/:path*"],
};
