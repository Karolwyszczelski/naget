// src/app/components/product/ProductLayout.tsx
"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductDefinition } from "../../../lib/products";
import { useCart } from "../../CartContext";

type ProductLayoutProps = {
  product: ProductDefinition;
  children: ReactNode; // tu wchodzi konkretny konfigurator
};

export default function ProductLayout({ product, children }: ProductLayoutProps) {
  const { totalAmount } = useCart();

  return (
    <section className="section bg-white/90">
      <div className="container space-y-8">
        {/* breadcrumbs */}
        <nav className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
          <Link href="/" className="hover:text-accent">
            Sklep
          </Link>{" "}
          /{" "}
          <Link
            href={`/${product.series}`}
            className="hover:text-accent"
          >
            {product.series === "stand-up" && "Seria Stand Up"}
            {product.series === "slab-fence" && "Seria Slab Fence"}
            {product.series === "addons" && "Dodatki"}
          </Link>{" "}
          / <span className="text-primary">{product.shortName}</span>
        </nav>

        {/* nagłówek + grafika */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
              {product.series === "stand-up" && "Seria Stand Up"}
              {product.series === "slab-fence" && "Seria Slab Fence"}
              {product.series === "addons" && "Dodatki do ogrodzeń"}
            </p>
            <h1 className="text-[26px] md:text-[32px] font-extrabold text-primary">
              {product.seo.h1}
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800">
              {product.lead}
            </p>
            <p className="text-[13px] text-neutral-600">
              Ceny orientacyjne – ostateczna wycena może się różnić po
              weryfikacji projektu przez dział techniczny Naget.
            </p>
          </div>

          <div className="relative w-full h-56 md:h-64 rounded-3xl overflow-hidden shadow-soft bg-white">
            <Image
              src={product.heroImage}
              alt={product.name}
              fill
              className="object-cover object-center"
            />
          </div>
        </div>

        {/* główny grid: konfigurator + podsumowanie */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          {/* konfigurator przekazany w children */}
          <div>{children}</div>

          {/* prawa kolumna – podsumowanie zamówienia */}
          <aside className="rounded-3xl bg-white/95 border border-border shadow-soft p-5 space-y-4 sticky top-24">
            <h2 className="text-[16px] md:text-[18px] font-bold text-primary">
              Podsumowanie zamówienia
            </h2>
            <p className="text-[13px] text-neutral-700">
              Po dodaniu konfiguracji do koszyka zobaczysz ją również w mini
              podsumowaniu w nagłówku. Możesz skonfigurować kilka wariantów
              tego samego produktu.
            </p>
            <div className="pt-2 border-t border-border/70">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                Orientacyjna wartość koszyka
              </p>
              <p className="text-[18px] font-extrabold text-primary">
                {totalAmount.toLocaleString("pl-PL", {
                  style: "currency",
                  currency: "PLN",
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <Link
              href="/koszyk"
              className="btn btn-sm w-full justify-center mt-2"
            >
              Przejdź do koszyka
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
