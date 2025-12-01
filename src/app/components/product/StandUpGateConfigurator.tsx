// src/app/components/product/StandUpGateConfigurator.tsx
"use client";

import { useMemo, useState } from "react";
import { useCart } from "../../CartContext";
import type { ProductDefinition } from "../../../lib/products";

const standardHeights = [
  { id: "150", label: "150 cm" },
  { id: "160", label: "160 cm" },
  { id: "170", label: "170 cm" },
  { id: "180", label: "180 cm" },
];

const standardWidths = [
  { id: "100", label: "100 cm" },
  { id: "110", label: "110 cm" },
  { id: "120", label: "120 cm" },
];

const colors = [
  {
    id: "ral-7016",
    label: "Antracyt RAL 7016",
    hex: "#383E4A",
  },
  {
    id: "ral-9005",
    label: "Czarny RAL 9005",
    hex: "#111111",
  },
  {
    id: "ral-7035",
    label: "Jasnoszary RAL 7035",
    hex: "#D9DDE1",
  },
];

type Props = {
  product: ProductDefinition;
};

export default function StandUpGateConfigurator({ product }: Props) {
  const { addItem } = useCart();

  const [variant, setVariant] = useState<"standard" | "custom">("standard");
  const [heightId, setHeightId] = useState(standardHeights[0].id);
  const [widthId, setWidthId] = useState(standardWidths[0].id);
  const [customHeight, setCustomHeight] = useState<number | "">("");
  const [customWidth, setCustomWidth] = useState<number | "">("");
  const [fillType, setFillType] = useState<"prosta" | "twist">("prosta");
  const [opening, setOpening] = useState<"lewa" | "prawa">("lewa");
  const [colorId, setColorId] = useState(colors[0].id);

  const selectedHeight =
    standardHeights.find((h) => h.id === heightId) ?? standardHeights[0];
  const selectedWidth =
    standardWidths.find((w) => w.id === widthId) ?? standardWidths[0];
  const selectedColor =
    colors.find((c) => c.id === colorId) ?? colors[0];

  const { price, priceLabel, isCustomInvalid } = useMemo(() => {
    const base = product.basePrice; // 3200

    let factor = 1;

    if (variant === "custom") {
      const h = typeof customHeight === "number" ? customHeight : 0;
      const w = typeof customWidth === "number" ? customWidth : 0;

      const invalid =
        !h || !w || h < 120 || h > 220 || w < 90 || w > 150;

      if (invalid) {
        return {
          price: base,
          priceLabel: base.toLocaleString("pl-PL", {
            style: "currency",
            currency: "PLN",
          }),
          isCustomInvalid: true,
        };
      }

      // prosty przelicznik: + do 20% za wymiar i szerokość
      const oversizeFactor =
        (h > 180 ? 0.1 : 0) + (w > 120 ? 0.1 : 0);
      factor = 1.1 + oversizeFactor;
    }

    if (fillType === "twist") {
      factor += 0.05;
    }

    const final = Math.round(base * factor / 10) * 10;

    return {
      price: final,
      priceLabel: final.toLocaleString("pl-PL", {
        style: "currency",
        currency: "PLN",
      }),
      isCustomInvalid: false,
    };
  }, [product.basePrice, variant, customHeight, customWidth, fillType]);

  const handleAddToCart = () => {
    if (variant === "custom" && isCustomInvalid) {
      alert(
        "Podaj poprawne wymiary furtki (wysokość 120–220 cm, szerokość 90–150 cm)."
      );
      return;
    }

    const heightLabel =
      variant === "standard"
        ? selectedHeight.label
        : `${customHeight} cm`;

    const widthMm =
      variant === "standard"
        ? Number(selectedWidth.id) * 10
        : typeof customWidth === "number"
        ? Math.round(customWidth * 10)
        : undefined;

    addItem({
      productId: product.id,
      name: product.name,
      series: product.series,
      unitPrice: price,
      quantity: 1,
      config: {
        variant,
        heightLabel,
        widthMm,
        colorId: selectedColor.id,
        colorName: selectedColor.label,
        material: "aluminium",
        fillType,
        openingDirection: opening,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Wariant: standard / na wymiar */}
      <section className="rounded-3xl bg-white/95 border border-border p-5 space-y-4 shadow-soft">
        <h2 className="text-[16px] md:text-[18px] font-bold text-primary">
          Wybierz wariant furtki
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setVariant("standard")}
            className={`btn-sm inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-[12px] uppercase tracking-[0.14em] ${
              variant === "standard"
                ? "bg-accent text-white border-accent"
                : "bg-white text-primary border-border hover:border-accent hover:text-accent"
            }`}
          >
            Wysokości standardowe
          </button>
          <button
            type="button"
            onClick={() => setVariant("custom")}
            className={`btn-sm inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-[12px] uppercase tracking-[0.14em] ${
              variant === "custom"
                ? "bg-accent text-white border-accent"
                : "bg-white text-primary border-border hover:border-accent hover:text-accent"
            }`}
          >
            Na wymiar
          </button>
        </div>

        {variant === "standard" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[12px] font-semibold text-primary mb-1">
                Wysokość furtki
              </p>
              <div className="flex flex-wrap gap-2">
                {standardHeights.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHeightId(h.id)}
                    className={`px-3 py-1 rounded-full border text-[12px] ${
                      heightId === h.id
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-semibold text-primary mb-1">
                Szerokość furtki (światło przejścia)
              </p>
              <div className="flex flex-wrap gap-2">
                {standardWidths.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWidthId(w.id)}
                    className={`px-3 py-1 rounded-full border text-[12px] ${
                      widthId === w.id
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[12px] font-semibold text-primary mb-1">
                Wysokość (cm)
              </p>
              <input
                type="number"
                className="w-full rounded-2xl border border-border bg-white/80 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                min={120}
                max={220}
                value={customHeight}
                onChange={(e) =>
                  setCustomHeight(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Zakres 120–220 cm.
              </p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-primary mb-1">
                Szerokość światła furtki (cm)
              </p>
              <input
                type="number"
                className="w-full rounded-2xl border border-border bg-white/80 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                min={90}
                max={150}
                value={customWidth}
                onChange={(e) =>
                  setCustomWidth(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Zakres 90–150 cm. Powyżej tych wymiarów zalecamy kontakt z
                działem technicznym.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 2. Wypełnienie, kierunek, kolor + podgląd */}
      <section className="rounded-3xl bg-white/95 border border-border p-5 space-y-5 shadow-soft">
        <h2 className="text-[16px] md:text-[18px] font-bold text-primary">
          Wygląd furtki
        </h2>

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)] items-start">
          {/* lewa: opcje */}
          <div className="space-y-4">
            <div>
              <p className="text-[12px] font-semibold text-primary mb-1">
                Wypełnienie
              </p>
              <div className="flex flex-wrap gap-2">
                {(["prosta", "twist"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFillType(type)}
                    className={`px-3 py-1 rounded-full border text-[12px] uppercase tracking-[0.12em] ${
                      fillType === type
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    {type === "prosta" ? "Prosta" : "Twist"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-semibold text-primary mb-1">
                Kierunek otwierania (od strony posesji)
              </p>
              <div className="flex flex-wrap gap-2">
                {(["lewa", "prawa"] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setOpening(dir)}
                    className={`px-3 py-1 rounded-full border text-[12px] ${
                      opening === dir
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    {dir === "lewa" ? "Lewe" : "Prawe"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-semibold text-primary mb-1">
                Kolor konstrukcji
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorId(c.id)}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-1 text-[12px] ${
                      colorId === c.id
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-white/60"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* prawa: prosty podgląd furtki */}
          <div className="rounded-3xl bg-neutral-50 border border-border/70 p-4 flex flex-col gap-3">
            <p className="text-[12px] text-neutral-600">
              Podgląd poglądowy – finalny wygląd może się różnić od renderów
              marketingowych.
            </p>
            <div className="relative flex-1 rounded-2xl bg-white flex items-center justify-center">
              <div className="relative w-[70%] h-[70%] rounded-lg border-4 border-neutral-300 overflow-hidden">
                {/* słupek zawiasowy */}
                <div
                  className="absolute inset-y-0 left-0 w-[10%]"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                {/* skrzydło */}
                <div
                  className="absolute inset-y-2 left-[12%] right-2 rounded-sm"
                  style={{ backgroundColor: selectedColor.hex }}
                >
                  {fillType === "twist" && (
                    <div className="w-full h-full opacity-35 bg-[radial-gradient(circle_at_0_0,#ffffff_0,#ffffff_20%,transparent_60%)]" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/70">
              <div className="text-[12px] text-neutral-700">
                <p>
                  Wysokość:{" "}
                  <strong>
                    {variant === "standard"
                      ? selectedHeight.label
                      : customHeight
                      ? `${customHeight} cm`
                      : "-"}
                  </strong>
                </p>
                <p>
                  Szerokość:{" "}
                  <strong>
                    {variant === "standard"
                      ? selectedWidth.label
                      : customWidth
                      ? `${customWidth} cm`
                      : "-"}
                  </strong>
                </p>
                <p>
                  Kolor: <strong>{selectedColor.label}</strong>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  Cena orientacyjna
                </p>
                <p className="text-[18px] font-extrabold text-primary">
                  {priceLabel}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="btn btn-sm w-full justify-center mt-2"
            >
              Dodaj konfigurację do koszyka
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
