"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaUser, FaShoppingCart, FaStar } from "react-icons/fa";
import { useCart } from "../CartContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";

type WishlistPreviewItem = {
  id: string;
  productId: string;
  name?: string;
  href?: string;
  fromPrice?: string;
};

export default function Navbar() {
  const supabase = createClientComponentClient();
  const { items, itemsCount, totalAmount } = useCart();

  const [user, setUser] = useState<User | null>(null);

  // stany popupów (hover) – nie znikają po wejściu myszą w panel
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountHoverOpen, setAccountHoverOpen] = useState(false);

  // wishlist preview
  const [wishlistItems, setWishlistItems] = useState<WishlistPreviewItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // modal logowania / rejestracji / panelu konta
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "account">(
    "login"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const formattedTotal = totalAmount.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  });

  const cartPreview = items.slice(0, 3);

  // pobranie usera + nasłuch zmian sesji Supabase Auth
  useEffect(() => {
    let isMounted = true;

    const initUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(user ?? null);
    };

    initUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // wczytanie podglądu listy życzeń (dla aktualnej tożsamości – anon cookie + ew. user)
  useEffect(() => {
    let isMounted = true;

    const loadWishlist = async () => {
      try {
        setWishlistLoading(true);
        const res = await fetch("/api/wishlist", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          if (!isMounted) return;
          setWishlistItems([]);
          return;
        }
        const data: any = await res.json();
        if (!isMounted) return;

        const items: WishlistPreviewItem[] = Array.isArray(data.items)
          ? data.items.map((item: any) => ({
              id: item.id,
              productId: item.productId ?? item.product_id,
              name:
                item.config?.name ??
                item.config?.productName ??
                item.productName ??
                undefined,
              href: item.config?.href ?? undefined,
              fromPrice: item.config?.fromPrice ?? undefined,
            }))
          : [];

        setWishlistItems(items);
      } catch {
        if (!isMounted) return;
        setWishlistItems([]);
      } finally {
        if (isMounted) setWishlistLoading(false);
      }
    };

    loadWishlist();

    if (typeof window !== "undefined") {
      const handler = () => {
        loadWishlist();
      };
      window.addEventListener("naget:wishlist-changed", handler);
      return () => {
        isMounted = false;
        window.removeEventListener("naget:wishlist-changed", handler);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthModalOpen(false);
          setPassword("");
        }
      } else if (authMode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || undefined,
            },
          },
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthInfo("Sprawdź skrzynkę e-mail, aby potwierdzić rejestrację.");
          setPassword("");
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthModalOpen(false);
  };

  const openLoginModal = () => {
    setAuthMode("login");
    setAuthError(null);
    setAuthInfo(null);
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthMode("register");
    setAuthError(null);
    setAuthInfo(null);
    setAuthModalOpen(true);
  };

  const openAccountModal = () => {
    setAuthMode("account");
    setAuthError(null);
    setAuthInfo(null);
    setAuthModalOpen(true);
  };

  const userInitial =
    user?.user_metadata?.full_name?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "U";

  const wishlistCount = wishlistItems.length;

  return (
    <>
      {/* GÓRNY PASEK ACCENT */}
      <header className="w-full sticky top-0 z-50">
        <div className="w-full bg-accent text-white text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.24em] text-center py-1">
          Oficjalny sklep producenta ogrodzeń premium Naget
        </div>

        {/* BIAŁY NAVBAR POD PASKIEM */}
        <div className="w-full bg-white shadow-md">
          <nav className="container flex items-center justify-between py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-naget.png"
                alt="Naget"
                width={60}
                height={60}
                priority
              />
            </Link>

            {/* Linki główne */}
            <ul className="hidden md:flex items-center gap-6">
              <li>
                <Link
                  href={{ pathname: "/", hash: "produkty-stand-up" }}
                  className="nav-link text-primary"
                >
                  STAND UP
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/", hash: "produkty-slab-fence" }}
                  className="nav-link text-primary"
                >
                  SLAB FENCE
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/", hash: "produkty-addons" }}
                  className="nav-link text-primary"
                >
                  DODATKI
                </Link>
              </li>
              <li className="flex flex-col items-center leading-none">
                <Link href="/wyprzedaz" className="nav-link text-accent">
                  WYPRZEDAŻ
                </Link>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-accentLight">
                  NAGET
                </span>
              </li>
              <li>
                <Link href="/kontakt" className="nav-link text-primary">
                  KONTAKT
                </Link>
              </li>
            </ul>

            {/* Ikony po prawej + popupy sterowane stanem */}
            <div className="flex items-center gap-4 text-lg text-neutral-700">
              {/* LISTA ŻYCZEŃ */}
              <div
                className="relative"
                onMouseEnter={() => setWishlistOpen(true)}
                onMouseLeave={() => setWishlistOpen(false)}
              >
                <Link
                  href="/lista-zyczen"
                  aria-label="Lista życzeń"
                  className="relative flex items-center justify-center h-9 w-9"
                >
                  <FaStar className="transition-colors text-yellow-400 hover:text-accent" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white px-1">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {wishlistOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-white shadow-soft z-40">
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                        Lista życzeń
                      </p>

                      {wishlistLoading ? (
                        <p className="text-[13px] text-neutral-700">
                          Ładuję zapisane produkty...
                        </p>
                      ) : wishlistCount === 0 ? (
                        <p className="text-[13px] text-neutral-700">
                          Na razie nie masz produktów na liście życzeń.
                        </p>
                      ) : (
                        <>
                          <ul className="space-y-1 max-h-40 overflow-y-auto">
                            {wishlistItems.slice(0, 3).map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between gap-2 text-[12px] text-neutral-800"
                              >
                                <div className="flex-1">
                                  {item.href ? (
                                    <Link
                                      href={item.href}
                                      className="font-semibold hover:text-accent transition-colors"
                                    >
                                      {item.name || item.productId}
                                    </Link>
                                  ) : (
                                    <span className="font-semibold">
                                      {item.name || item.productId}
                                    </span>
                                  )}
                                  {item.fromPrice && (
                                    <p className="text-[11px] text-neutral-500">
                                      {item.fromPrice}
                                    </p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                          {wishlistCount > 3 && (
                            <p className="text-[11px] text-neutral-500">
                              + {wishlistCount - 3} kolejnych produktów
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="border-t border-border px-4 py-2 flex justify-between items-center gap-2">
                      <span className="text-[11px] text-neutral-500">
                        Razem:{" "}
                        <strong className="text-primary">
                          {wishlistCount}
                        </strong>{" "}
                        pozycji
                      </span>
                      <Link
                        href="/lista-zyczen"
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent hover:text-accentLight transition-colors"
                      >
                        Przejdź do listy
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* PANEL KLIENTA */}
              <div
                className="relative"
                onMouseEnter={() => setAccountHoverOpen(true)}
                onMouseLeave={() => setAccountHoverOpen(false)}
              >
                <button
                  type="button"
                  onClick={() =>
                    user ? openAccountModal() : openLoginModal()
                  }
                  aria-label={user ? "Moje konto" : "Konto użytkownika"}
                  className="relative flex items-center justify-center h-9 w-9 rounded-full border border-border bg-white shadow-soft"
                >
                  {user ? (
                    <span className="text-[13px] font-semibold text-accent">
                      {userInitial}
                    </span>
                  ) : (
                    <FaUser className="hover:text-accent transition-colors text-accent text-[18px]" />
                  )}
                </button>

                {accountHoverOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-white shadow-soft z-40">
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                        Panel klienta
                      </p>

                      {user ? (
                        <>
                          <p className="text-[13px] text-neutral-700">
                            Zalogowano jako:
                            <br />
                            <span className="font-semibold">
                              {user.user_metadata?.full_name ||
                                user.email}
                            </span>
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Lista życzeń:{" "}
                            <strong>{wishlistCount}</strong> produktów
                          </p>
                        </>
                      ) : (
                        <p className="text-[13px] text-neutral-700">
                          Zaloguj się, aby zobaczyć swoje zamówienia,
                          projekty i konfiguracje.
                        </p>
                      )}
                    </div>
                    <div className="border-t border-border px-4 py-2 flex justify-between gap-2">
                      {user ? (
                        <>
                          <button
                            type="button"
                            onClick={openAccountModal}
                            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary hover:text-accent transition-colors"
                          >
                            Moje konto
                          </button>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent hover:text-accentLight transition-colors"
                          >
                            Wyloguj
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={openLoginModal}
                            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent hover:text-accentLight transition-colors"
                          >
                            Logowanie
                          </button>
                          <button
                            type="button"
                            onClick={openRegisterModal}
                            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary hover:text-accent transition-colors"
                          >
                            Rejestracja
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* KOSZYK + PODSUMOWANIE */}
              <div
                className="relative"
                onMouseEnter={() => setCartOpen(true)}
                onMouseLeave={() => setCartOpen(false)}
              >
                <Link
                  href="/koszyk"
                  className="flex items-center gap-2"
                  aria-label="Koszyk"
                >
                  <div className="relative flex items-center justify-center h-9 w-9 rounded-full border border-border bg-white shadow-soft">
                    <FaShoppingCart className="text-accent text-[18px]" />
                    {itemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white px-1">
                        {itemsCount}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col leading-tight">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Koszyk
                    </span>
                    <span className="text-[12px] font-semibold text-primary">
                      {formattedTotal}
                    </span>
                  </div>
                </Link>

                {cartOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-white shadow-soft z-40">
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                        Podsumowanie koszyka
                      </p>

                      {itemsCount === 0 ? (
                        <p className="text-[13px] text-neutral-700">
                          Twój koszyk jest pusty. Dodaj produkt, aby
                          rozpocząć konfigurację.
                        </p>
                      ) : (
                        <>
                          <ul className="space-y-1 max-h-40 overflow-y-auto">
                            {cartPreview.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-start justify-between gap-2 text-[12px] text-neutral-800"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold">
                                    {item.name}
                                  </p>
                                  {item.config?.variant === "custom" && (
                                    <p className="text-[11px] text-neutral-500">
                                      Na wymiar • {item.config.widthMm} mm
                                      szer.
                                    </p>
                                  )}
                                  {item.config?.variant === "standard" && (
                                    <p className="text-[11px] text-neutral-500">
                                      Wysokość: {item.config.heightLabel}
                                    </p>
                                  )}
                                  {item.config?.colorName && (
                                    <p className="text-[11px] text-neutral-500">
                                      {item.config.colorName}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right whitespace-nowrap text-[12px] font-semibold text-primary">
                                  {(item.unitPrice * item.quantity).toLocaleString(
                                    "pl-PL",
                                    {
                                      style: "currency",
                                      currency: "PLN",
                                      minimumFractionDigits: 2,
                                    }
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>

                          {itemsCount > cartPreview.length && (
                            <p className="text-[11px] text-neutral-500">
                              + {itemsCount - cartPreview.length} kolejnych
                              pozycji
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                              Razem
                            </span>
                            <span className="text-[13px] font-semibold text-primary">
                              {formattedTotal}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="border-t border-border px-4 py-2 flex justify-between gap-2">
                      <Link
                        href="/koszyk"
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary hover:text-accent transition-colors"
                      >
                        Przejdź do koszyka
                      </Link>
                      <Link
                        href="/koszyk"
                        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent hover:text-accentLight transition-colors"
                      >
                        Do kasy
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* MODAL LOGOWANIA / REJESTRACJI / KONTA */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-soft border border-border p-6 relative">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 text-sm"
            >
              ✕
            </button>

            {/* nagłówek + zakładki */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  {authMode === "account"
                    ? "Moje konto"
                    : authMode === "login"
                    ? "Logowanie"
                    : "Rejestracja"}
                </p>
                <h2 className="text-[18px] md:text-[20px] font-bold text-primary">
                  {authMode === "account"
                    ? "Panel klienta"
                    : "Konto klienta Naget"}
                </h2>
              </div>

              {authMode !== "account" && (
                <div className="flex gap-1 rounded-full bg-neutral-100 p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`px-2 py-1 rounded-full ${
                      authMode === "login"
                        ? "bg-white text-primary shadow-soft"
                        : "text-neutral-500"
                    }`}
                  >
                    Logowanie
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className={`px-2 py-1 rounded-full ${
                      authMode === "register"
                        ? "bg-white text-primary shadow-soft"
                        : "text-neutral-500"
                    }`}
                  >
                    Rejestracja
                  </button>
                </div>
              )}
            </div>

            {/* treść modala */}
            {authMode === "account" && user ? (
              <div className="space-y-4 text-[13px]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-accent text-white font-semibold">
                    {userInitial}
                  </div>
                  <div>
                    <p className="text-[13px] text-neutral-500">
                      Zalogowano jako
                    </p>
                    <p className="text-[14px] font-semibold text-primary">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border bg-neutral-50/60 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
                      Lista życzeń
                    </p>
                    <p className="text-[13px] text-neutral-800">
                      Masz{" "}
                      <strong className="text-primary">
                        {wishlistCount}
                      </strong>{" "}
                      produktów zapisanych na liście życzeń.
                    </p>
                    <Link
                      href="/lista-zyczen"
                      onClick={() => setAuthModalOpen(false)}
                      className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-accent hover:text-accentLight transition-colors"
                    >
                      Otwórz listę życzeń
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-dashed border-border p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
                      Zamówienia i kody rabatowe
                    </p>
                    <p className="text-[13px] text-neutral-700">
                      Tutaj możesz później podpiąć dane z tabel{" "}
                      <code>orders</code>, <code>order_items</code> lub
                      np. <code>discount_codes</code> w Supabase i
                      wyświetlać historię zakupów oraz aktywne kody.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-2">
                  <Link
                    href="/konto"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary hover:text-accent transition-colors"
                    onClick={() => setAuthModalOpen(false)}
                  >
                    Przejdź do panelu
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent hover:text-accentLight transition-colors"
                  >
                    Wyloguj
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleAuthSubmit}
                className="space-y-3 text-[13px]"
              >
                {authMode === "register" && (
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-neutral-700">
                      Imię i nazwisko (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Jak mamy się do Ciebie zwracać?"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-neutral-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    placeholder="twoj@email.pl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-neutral-700">
                    Hasło
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    placeholder="Min. 6 znaków"
                  />
                </div>

                {authError && (
                  <p className="text-[12px] text-red-600">{authError}</p>
                )}
                {authInfo && (
                  <p className="text-[12px] text-emerald-600">{authInfo}</p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="mt-2 w-full rounded-2xl bg-accent text-white text-[12px] font-semibold uppercase tracking-[0.18em] py-2 hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {authLoading
                    ? "Przetwarzanie..."
                    : authMode === "login"
                    ? "Zaloguj się"
                    : "Załóż konto"}
                </button>

                <p className="mt-2 text-[11px] text-neutral-500 text-center">
                  {authMode === "login" ? (
                    <>
                      Nie masz jeszcze konta?{" "}
                      <button
                        type="button"
                        className="underline underline-offset-2 text-accent"
                        onClick={() => setAuthMode("register")}
                      >
                        Zarejestruj się
                      </button>
                    </>
                  ) : (
                    <>
                      Masz już konto?{" "}
                      <button
                        type="button"
                        className="underline underline-offset-2 text-accent"
                        onClick={() => setAuthMode("login")}
                      >
                        Zaloguj się
                      </button>
                    </>
                  )}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
