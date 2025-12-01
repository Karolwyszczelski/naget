"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSearch, FaShoppingCart, FaStar } from "react-icons/fa";
import { useCart } from "../CartContext";

type Series = "stand-up" | "slab-fence" | "addons";

type ProductCard = {
  id: string;
  name: string;
  series: Series;
  type: "furtka" | "brama" | "zadaszenie" | "dodatek";
  description: string;
  fromPrice: string;
  href: string;
  image: string;
};

const products: ProductCard[] = [
  {
    id: "standup-furtka",
    name: "Furtka Stand Up",
    series: "stand-up",
    type: "furtka",
    description:
      "Furtka aluminiowa z pionowych profili – dostępna w wersji prostej i twist, także na wymiar.",
    fromPrice: "od 3 200 zł",
    href: "/stand-up/furtka",
    image: "/products/furtka-stand.png",
  },
  {
    id: "standup-brama-jedno",
    name: "Brama przesuwna Stand Up",
    series: "stand-up",
    type: "brama",
    description:
      "Brama przesuwna Stand Up dopasowana do ogrodzeń panelowych i nowoczesnych frontów.",
    fromPrice: "od 7 900 zł",
    href: "/stand-up/brama-przesuwna",
    image: "/products/standup-brama-jednos.png",
  },
  {
    id: "standup-brama-dwuskrzydlowa",
    name: "Brama dwuskrzydłowa Stand Up",
    series: "stand-up",
    type: "brama",
    description:
      "Brama przesuwna Stand Up dopasowana do ogrodzeń panelowych i nowoczesnych frontów.",
    fromPrice: "od 7 900 zł",
    href: "/stand-up/brama-dwuskrzydlowa",
    image: "/products/standup-brama-dwuskrzydlowa.png",
  },
  {
    id: "slab-furtka",
    name: "Furtka Slab Fence",
    series: "slab-fence",
    type: "furtka",
    description:
      "Pełna furtka z paneli Slab Fence – więcej prywatności przy zachowaniu lekkiej formy.",
    fromPrice: "od 3 600 zł",
    href: "/slab-fence/furtka",
    image: "/products/furtka-slab.png",
  },
  {
    id: "slab-brama",
    name: "Brama przesuwna Slab Fence",
    series: "slab-fence",
    type: "brama",
    description:
      "Pełna brama przesuwna z serii Slab Fence – idealna do zabudowy frontowej.",
    fromPrice: "od 8 400 zł",
    href: "/slab-fence/brama-przesuwna",
    image: "/products/brama-slab1.png",
  },
  {
    id: "slab-brama-dwuskrzydlowa",
    name: "Brama dwuskrzydłowa Slab Fence",
    series: "slab-fence",
    type: "brama",
    description:
      "Pełna brama przesuwna z serii Slab Fence – idealna do zabudowy frontowej.",
    fromPrice: "od 8 400 zł",
    href: "/slab-fence/brama-dwuskrzydlowa",
    image: "/products/slab-brama-dwuskrzydlowa.png",
  },
  {
    id: "standup-zadaszenie",
    name: "Zadaszenie Stand Up",
    series: "stand-up",
    type: "zadaszenie",
    description:
      "Zadaszenie nad furtkę Stand Up – spójny design z resztą ogrodzenia.",
    fromPrice: "od 1 200 zł",
    href: "/stand-up/zadaszenie",
    image: "/products/zadaszenie-stand.png",
  },
  {
    id: "slab-zadaszenie",
    name: "Zadaszenie Slab Fence",
    series: "slab-fence",
    type: "zadaszenie",
    description:
      "Zadaszenie nad furtkę Slab Fence – spójny design z resztą ogrodzenia.",
    fromPrice: "od 1 200 zł",
    href: "/slab-fence/zadaszenie",
    image: "/products/slab-zadaszenie.png",
  },
  {
    id: "addons-automat",
    name: "Automatyka do bram",
    series: "addons",
    type: "dodatek",
    description:
      "Napędy, fotokomórki, akcesoria – kompletna automatyka dopasowana do bram Naget.",
    fromPrice: "od 1 500 zł",
    href: "/dodatki/automatyka",
    image: "/products/addons-automat.png",
  },
  {
    id: "addons-drewutnie",
    name: "Drewutnie",
    series: "addons",
    type: "dodatek",
    description:
      "Drewutnie ogrodowe – praktyczne i estetyczne rozwiązanie do przechowywania drewna.",
    fromPrice: "od 1 500 zł",
    href: "/dodatki/drewutnie",
    image: "/products/addons-drewutnie.png",
  },
  {
    id: "addons-slupki-multimedialne-paczkomaty",
    name: "Słupki multimedialne i paczkomaty",
    series: "addons",
    type: "dodatek",
    description:
      "Słupki multimedialne i paczkomaty – nowoczesne rozwiązania do ogrodzeń i bram.",
    fromPrice: "od 1 500 zł",
    href: "/dodatki/slupki-multimedialne-paczkomaty",
    image: "/products/addons-slupki-multimedialne-paczkomaty.png",
  },
];

const seriesMeta: { id: Series; title: string; description: string }[] = [
  {
    id: "stand-up",
    title: "Seria Stand Up",
    description:
      "System bram, furtek i zadaszeń z pionowych profili – idealny do ogrodzeń panelowych i nowoczesnych frontów.",
  },
  {
    id: "slab-fence",
    title: "Seria Slab Fence",
    description:
      "Pełne zabudowy z poziomych paneli – więcej prywatności, ochrona przed wiatrem i spójny wygląd całego ogrodzenia.",
  },
  {
    id: "addons",
    title: "Dodatki do ogrodzeń",
    description:
      "Automatyka, zamki, akcesoria i elementy montażowe – uzupełnienie dla systemów Stand Up i Slab Fence.",
  },
];

function parsePricePLN(fromPrice: string): number {
  const cleaned = fromPrice.replace(/[^\d,]/g, "").replace(",", ".");
  const numeric = parseFloat(cleaned);
  return isNaN(numeric) ? 0 : numeric;
}

/**
 * Dodatkowe klasy dla obrazków – per produkt.
 * Tu możesz łatwo sterować zoomem / kadrowaniem dla każdego ID osobno.
 */
function getProductImageClasses(productId: string): string {
  switch (productId) {
    case "addons-drewutnie":
      // delikatny zoom na hover
      return "transform scale-[1.6] transition-transform duration-500 ease-out group-hover:scale-[1.8]";
    case "addons-automat":
      // lekkie stałe przybliżenie
      return "transform scale-[1.4] transition-transform duration-500 ease-out group-hover:scale-[1.6]";
    case "addons-slupki-multimedialne-paczkomaty":
      return "transform scale-[1.5] transition-transform duration-500 ease-out group-hover:scale-[1.7]";
    case "slab-brama":
      // mocniejszy zoom na hover, przydatny przy długiej bramie
      return "transform scale-[1.5] transition-transform duration-500 ease-out group-hover:scale-[1.7]";
    case "slab-brama-dwuskrzydlowa":
      return "transform transition-transform duration-500 ease-out group-hover:scale-110";
    case "slab-furtka":
      // trochę bliżej, żeby pokazać detal
      return "transform scale-[1.2] transition-transform duration-500 ease-out group-hover:scale-[1.4]";
    case "standup-brama-jedno":
      return "transform scale-[1.5] transition-transform duration-500 ease-out group-hover:scale-[1.7]";
    case "standup-brama-dwuskrzydlowa":
      return "transform transition-transform duration-500 ease-out group-hover:scale-[1.08]";
    case "standup-furtka":
      return "transform scale-[2] transition-transform duration-500 ease-out group-hover:scale-[2.3]";
    case "standup-zadaszenie":
      return "transform scale-[1.4] transition-transform duration-500 ease-out group-hover:scale-[1.6]";  
    case "slab-zadaszenie":
      return "transform scale-[1.8] transition-transform duration-500 ease-out group-hover:scale-[2]";
    // reszta produktów – na razie bez specjalnego efektu,
    // ale możesz dodać kolejne case'y kiedy będziesz miał nowe makiety
    default:
      return "";
  }
}

export default function ProductsSection() {
  const [search, setSearch] = useState("");
  const [seriesFilter, setSeriesFilter] = useState<Series | "all">("all");

  const { totalAmount, addItem } = useCart();

  // lista życzeń – synchronizowana z API / Supabase
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // 1) Wczytanie listy życzeń z backendu (/api/wishlist)
  useEffect(() => {
    let isMounted = true;

    const loadWishlist = async () => {
      try {
        const res = await fetch("/api/wishlist", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) return;

        const data: any = await res.json();
        if (!isMounted) return;

        if (Array.isArray(data.items)) {
          const ids = data.items
            .map((item: any) => item.productId ?? item.product_id)
            .filter((id: unknown): id is string => typeof id === "string");

          setWishlistIds(ids);
        }
      } catch {
        // spokojnie ignorujemy – UI po prostu pokaże pustą listę życzeń
      }
    };

    loadWishlist();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2) Toggle listy życzeń – wysyła do /api/wishlist (toggle w Supabase)
  const toggleWishlist = async (product: ProductCard) => {
    const prevIds = wishlistIds;
    const currentlyInWishlist = prevIds.includes(product.id);

    // optymistyczna aktualizacja UI
    const optimisticIds = currentlyInWishlist
      ? prevIds.filter((id) => id !== product.id)
      : [...prevIds, product.id];

    setWishlistIds(optimisticIds);

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          mode: "toggle",
          productId: product.id,
          // pakujemy dane produktu do config – trafią do JSONB w Supabase
          config: {
            source: "products-section",
            type: product.type,
            name: product.name,
            href: product.href,
            image: product.image,
            fromPrice: product.fromPrice,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Wishlist request failed");
      }

      const data: any = await res.json().catch(() => null);

      if (data && typeof data.inWishlist === "boolean") {
        setWishlistIds((prev) =>
          data.inWishlist
            ? [...new Set([...prev, product.id])]
            : prev.filter((id) => id !== product.id)
        );
      }

      // poinformuj navbar, że lista się zmieniła
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("naget:wishlist-changed", {
            detail: {
              productId: product.id,
              inWishlist: data?.inWishlist,
            },
          })
        );
      }
    } catch {
      // w razie błędu cofamy optymistyczną zmianę
      setWishlistIds(prevIds);
    }
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSeries =
        seriesFilter === "all" ? true : p.series === seriesFilter;
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term);
      return matchesSeries && matchesSearch;
    });
  }, [search, seriesFilter]);

  const hasAny = filtered.length > 0;

  const formattedCartTotal = totalAmount.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  });

  const handleAddToCart = (product: ProductCard) => {
    const unitPrice = parsePricePLN(product.fromPrice);

    addItem({
      productId: product.id,
      name: product.name,
      series: product.series,
      unitPrice,
      quantity: 1,
      config: {
        variant: "standard",
        heightLabel: "standardowa wysokość",
        colorId: "ral-7016",
        colorName: "Antracyt RAL 7016",
        material: product.series === "slab-fence" ? "trespa" : "aluminium",
      },
    });
  };

  return (
    <section
      id="produkty"
      className="section border-t border-border bg-transparent"
    >
      <div className="container space-y-6">
        {/* H1 pod SEO – niewidoczny */}
        <h1 className="sr-only">
          Sklep Naget – produkty z serii Stand Up, Slab Fence i dodatki do
          ogrodzeń
        </h1>

        {/* GÓRNY PASEK: tytuł + wyszukiwarka + filtry + mini-koszyk */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* LEWO – nagłówek */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
              Sklep
            </p>
            <p className="text-[20px] md:text-[40px] font-extrabold uppercase text-accent">
              PRODUKTY
            </p>
          </div>

          {/* ŚRODEK – wyszukiwarka + filtry serii */}
          <div className="flex-1 max-w-xl w-full">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Szukaj po nazwie lub opisie..."
                  className="w-full rounded-2xl border border-border bg-white/80 pl-9 pr-3 py-2 text-sm md:text-[14px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] md:text-[12px] items-center">
              {[
                { id: "all", label: "Wszystkie serie" },
                { id: "stand-up", label: "Stand Up" },
                { id: "slab-fence", label: "Slab Fence" },
                { id: "addons", label: "Dodatki" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() =>
                    setSeriesFilter(filter.id as Series | "all")
                  }
                  className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-[0.14em] ${
                    seriesFilter === filter.id
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-neutral-700 border-border hover:border-accent hover:text-accent"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRAWO – mini podsumowanie koszyka */}
          <div className="flex items-center justify-between md:justify-end gap-3 min-w-[170px]">
            <div className="flex items-center justify-center h-10 w-10 rounded-full border border-border bg-white shadow-soft">
              <FaShoppingCart className="text-accent text-lg" />
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                Koszyk
              </p>
              <p className="text-[14px] md:text-[15px] font-semibold text-primary">
                {formattedCartTotal}
              </p>
            </div>
          </div>
        </div>

        {/* krótki opis SEO */}
        <p className="text-[13px] md:text-[14px] text-neutral-700 max-w-3xl">
          Wybierz produkty z serii Stand Up lub Slab Fence, a także akcesoria i
          dodatki do ogrodzeń. Furtki, bramy przesuwne, bramy dwuskrzydłowe,
          zadaszenia i automatyka – w jednym miejscu.
        </p>

        {/* GRUPY PRODUKTÓW WG SERII */}
        {hasAny ? (
          <div className="space-y-10">
            {seriesMeta.map((series) => {
              const items = filtered.filter(
                (p) => p.series === series.id
              );
              if (!items.length) return null;

              return (
                <section
                  key={series.id}
                  id={`produkty-${series.id}`}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-[18px] md:text-[30px] font-extrabold uppercase text-accent">
                      {series.title}
                    </h2>
                    <p className="text-[13px] md:text-[14px] text-neutral-700">
                      {series.description}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    {items.map((product) => {
                      const inWishlist = wishlistIds.includes(product.id);
                      const imageExtraClasses = getProductImageClasses(
                        product.id
                      );
                      const baseImageClasses =
                        "object-cover object-center";

                      return (
                        <article
                          key={product.id}
                          className="group relative flex flex-col gap-3 rounded-2xl p-3 md:p-4 bg-transparent shadow-[0_18px_45px_rgba(62,82,164,0.14)]"
                        >
                          {/* gwiazdka – lista życzeń (Supabase przez /api/wishlist) */}
                          <button
                            type="button"
                            onClick={() => toggleWishlist(product)}
                            aria-label={
                              inWishlist
                                ? "Usuń z listy życzeń"
                                : "Dodaj do listy życzeń"
                            }
                            className="absolute top-3 right-3 text-[20px] transition-colors z-10"
                          >
                            <FaStar
                              className={
                                inWishlist
                                  ? "text-accent fill-accent"
                                  : "text-neutral-300 hover:text-yellow-400 transition-colors"
                              }
                            />
                          </button>

                          {/* obrazek produktu */}
                          <div className="relative w-full h-40 md:h-48 rounded-2xl overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className={`${baseImageClasses} ${imageExtraClasses}`}
                            />
                          </div>

                          {/* seria */}
                          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                            {product.series === "stand-up" && "Seria Stand Up"}
                            {product.series === "slab-fence" &&
                              "Seria Slab Fence"}
                            {product.series === "addons" &&
                              "Dodatki do ogrodzeń"}
                          </p>

                          {/* nazwa */}
                          <h3 className="text-[18px] md:text-[20px] font-extrabold text-accent uppercase">
                            {product.name}
                          </h3>

                          {/* opis */}
                          <p className="text-[14px] text-neutral-700">
                            {product.description}
                          </p>

                          {/* przyciski + cena */}
                          <div className="mt-auto pt-3 space-y-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product)}
                                className="btn btn-sm flex-1 w-full"
                              >
                                DODAJ DO KOSZYKA
                              </button>
                              <Link
                                href={product.href}
                                className="btn btn-sm btn-outline flex-1 w-full text-center whitespace-nowrap"
                              >
                                KONFIGURUJ
                              </Link>
                            </div>

                            <div className="flex justify-end">
                              <span className="text-[13px] md:text-[14px] font-semibold text-primary">
                                {product.fromPrice}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-600">
            Brak produktów spełniających wybrane filtry. Zmień serię lub usuń
            frazę wyszukiwania.
          </p>
        )}
      </div>
    </section>
  );
}
