"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../../CartContext";
import SlabBramadwuskrzydlowaModel from "../../../components/Slab-Bramadwuskrzydlowamodel";
import HeroSlider from "../../../components/HeroSlider";
import type { IconType } from "react-icons";
import {
  FaBorderAll,
  FaPalette,
  FaRulerCombined,
  FaDoorOpen,
  FaClipboardCheck,
  FaChevronRight,
} from "react-icons/fa";

/**
 * KONFIG SLAB FENCE – BRAMA DWUSKRZYDŁOWA
 * ----------------------------------------------------
 */

// baza awaryjna (fallback)
const basePrice = 12500;

// wysokości / szerokości (światło w cm)
// standard: 1500, 1700, 1800, 2000 mm
const standardHeights = [
  { id: "150", label: "150 cm" },
  { id: "170", label: "170 cm" },
  { id: "180", label: "180 cm" },
  { id: "200", label: "200 cm" },
];

// standard: 4000, 5000, 6000 mm
const standardWidths = [
  { id: "400", label: "400 cm (4000 mm)" },
  { id: "500", label: "500 cm (5000 mm)" },
  { id: "600", label: "600 cm (6000 mm)" },
];

type HplPattern = {
  id: string;
  label: string;
  group: string;
  factor: number;
  texture: string;
  colorHex: string;
};

const hplPatterns: HplPattern[] = [
  {
    id: "na17-natural-graphite",
    label: "NA17 Natural Graphite",
    group: "Mineralne / betonopodobne",
    factor: 1.03,
    texture: "/textures/slabfence/na17-natural-graphite.jpg",
    colorHex: "#5f6165",
  },
  {
    id: "nm04-sintered-alloy",
    label: "NM04 Sintered Alloy",
    group: "Mineralne / betonopodobne",
    factor: 1.0,
    texture: "/textures/slabfence/nm04-sintered-alloy.jpg",
    colorHex: "#8f9398",
  },
  {
    id: "nw18-light-mahogany",
    label: "NW18 Light Mahogany",
    group: "Drewno",
    factor: 1.06,
    texture: "/textures/slabfence/nw18-light-mahogany.jpg",
    colorHex: "#9c6945",
  },
];

// RAL – jak w Stand Up
const baseColors = [
  { id: "ral-7030", label: "RAL 7030 – jasny szary", hex: "#938C82" },
  { id: "ral-7016", label: "RAL 7016 – antracyt / grafit", hex: "#383E4A" },
  { id: "ral-9005", label: "RAL 9005 – czarny", hex: "#111111" },
  { id: "ral-8012", label: "RAL 8012 – miedziany brąz", hex: "#6B3B2A" },
  { id: "ral-8019", label: "RAL 8019 – ciemny brąz", hex: "#3D3635" },
  { id: "ral-7021", label: "RAL 7021 – ciemny grafit", hex: "#1F2421" },
];

const finishOptions = [
  {
    id: "mat",
    label: "Struktura mat",
    factor: 1.0,
    swatch: "/textures/struktura-mat.png",
  },
  {
    id: "brokat",
    label: "Struktura drobny brokat",
    factor: 1.03, // realnie w kalkulacji używamy +10%
    swatch: "/textures/struktura-brokat.png",
  },
] as const;

type FinishOption = (typeof finishOptions)[number];
type FinishId = FinishOption["id"];

type Step = 1 | 2 | 3 | 4 | 5;

type StepDef = {
  id: Step;
  label: string;
  icon: IconType;
};

// GRUPY CENOWE DLA BRAMY DWUSKRZYDŁOWEJ SLAB
type HeightTier = "150" | "170-180" | "200";
type WidthKey = "400" | "500" | "600";

// Cennik standardowy wg szerokości (mm) i wysokości (mm):
// 4000: 1500 → 12370, 1700/1800 → 13200, 2000 → 13340
// 5000: 1500 → 16700, 1700/1800 → 17150, 2000 → 17850
// 6000: 1500 → 20100, 1700/1800 → 20600, 2000 → 21300
const slabDoubleSwingPriceMatrix: Record<WidthKey, Record<HeightTier, number>> =
  {
    "400": {
      "150": 12370,
      "170-180": 13200,
      "200": 13340,
    },
    "500": {
      "150": 16700,
      "170-180": 17150,
      "200": 17850,
    },
    "600": {
      "150": 20100,
      "170-180": 20600,
      "200": 21300,
    },
  };

const mapHeightToTier = (heightCm: number): HeightTier => {
  if (heightCm <= 160) return "150"; // 1500
  if (heightCm < 190) return "170-180"; // 1700/1800
  return "200"; // 2000
};

export default function SlabFenceBramaDwuskrzydlowaPage() {
  const { addItem } = useCart();

  const [step, setStep] = useState<Step>(1);

  const steps: StepDef[] = [
    { id: 1, label: "Wzór płyty", icon: FaBorderAll },
    { id: 2, label: "Kolor ramy", icon: FaPalette },
    { id: 3, label: "Wymiary", icon: FaRulerCombined },
    { id: 4, label: "Automatyka i wyposażenie", icon: FaDoorOpen },
    { id: 5, label: "Podsumowanie", icon: FaClipboardCheck },
  ];

  const handleNextStep = () =>
    setStep((prev) => (prev < 5 ? ((prev + 1) as Step) : prev));
  const handlePrevStep = () =>
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  // wymiary
  const [variant, setVariant] = useState<"standard" | "custom">("standard");
  const [heightId, setHeightId] = useState(standardHeights[1].id); // 170
  const [widthId, setWidthId] = useState(standardWidths[1].id); // 500
  const [customHeight, setCustomHeight] = useState<number | "">("");
  const [customWidth, setCustomWidth] = useState<number | "">("");

  // płyta HPL
  const [hplId, setHplId] = useState<string>(hplPatterns[1].id); // Sintered Alloy

  // kolor ramy
  const [frameColorMode, setFrameColorMode] = useState<"standard" | "custom">(
    "standard"
  );
  const [frameColorId, setFrameColorId] = useState<string>(baseColors[1].id);
  const [customRalCode, setCustomRalCode] = useState<string>("");

  // struktura
  const [finishId, setFinishId] = useState<FinishId>("mat");

  // automatyka / wyposażenie
  const [openingSide, setOpeningSide] = useState<"left" | "right">("left"); // skrzydło czynne
  const [hasAutomationPrep, setHasAutomationPrep] = useState(true);
  const [hasLedInPosts, setHasLedInPosts] = useState(false);

  // ilość
  const [quantity, setQuantity] = useState(1);

  const selectedHeight =
    standardHeights.find((h) => h.id === heightId) ?? standardHeights[1];
  const selectedWidth =
    standardWidths.find((w) => w.id === widthId) ?? standardWidths[1];
  const selectedHpl =
    hplPatterns.find((p) => p.id === hplId) ?? hplPatterns[0];

  const selectedFrameColor =
    baseColors.find((c) => c.id === frameColorId) ?? baseColors[1];

  const selectedFinish =
    finishOptions.find((f) => f.id === finishId) ?? finishOptions[0];

  const previewFrameColorHex =
    frameColorMode === "standard" ? selectedFrameColor.hex : "#383E4A";
  const previewPanelTexture = selectedHpl.texture;
  const previewPanelColorHex = selectedHpl.colorHex;

  // KALKULACJA CENY
  const { unitPrice, priceLabel, totalLabel } = useMemo(() => {
    let baseFromMatrix: number | undefined;

    if (variant === "standard") {
      // cennik z tabeli
      const heightCm = Number(selectedHeight.id);
      const widthKey = selectedWidth.id as WidthKey;
      const heightTier = mapHeightToTier(heightCm);
      baseFromMatrix = slabDoubleSwingPriceMatrix[widthKey][heightTier];
    } else {
      // NA WYMIAR: 3500 zł / mb szerokości (światła wjazdu)
      const w =
        typeof customWidth === "number" && customWidth > 0
          ? customWidth
          : undefined;
      if (w) {
        const widthMeters = w / 100; // cm → m
        baseFromMatrix = widthMeters * 3500;
      }
    }

    let price = baseFromMatrix ?? basePrice;

    // dekor HPL
    price *= selectedHpl.factor;

    // dowolny RAL
    if (frameColorMode === "custom") {
      price *= 1.08;
    }

    // struktura brokat – +10% dopłaty
    if (finishId === "brokat") {
      price *= 1.1;
    }

    // dopłaty za wyposażenie
    if (hasAutomationPrep) price += 1450;
    if (hasLedInPosts) price += 600;

    price = Math.round(price);
    if (!Number.isFinite(price) || price <= 0) price = basePrice;

    const qty = Math.max(quantity, 1);
    const total = price * qty;

    return {
      unitPrice: price,
      priceLabel: price.toLocaleString("pl-PL", {
        style: "currency",
        currency: "PLN",
      }),
      totalLabel: total.toLocaleString("pl-PL", {
        style: "currency",
        currency: "PLN",
      }),
    };
  }, [
    variant,
    customWidth,
    frameColorMode,
    finishId,
    hasAutomationPrep,
    hasLedInPosts,
    quantity,
    selectedHpl.factor,
    selectedHeight.id,
    selectedWidth.id,
  ]);

  // DODANIE DO KOSZYKA
  const handleAddToCart = () => {
    const heightLabel =
      variant === "standard"
        ? selectedHeight.label
        : customHeight
        ? `${customHeight} cm`
        : "na wymiar";

    const widthMm =
      variant === "standard"
        ? Number(selectedWidth.id) * 10
        : typeof customWidth === "number"
        ? Math.round(customWidth * 10)
        : undefined;

    const frameColorName =
      frameColorMode === "standard"
        ? selectedFrameColor.label
        : customRalCode
        ? `RAL ${customRalCode}`
        : "Dowolny kolor RAL (dopłata)";

    const frameColorIdForCart =
      frameColorMode === "standard"
        ? selectedFrameColor.id
        : customRalCode || "custom-ral";

    addItem({
      productId: "slab-brama-dwuskrzydlowa",
      name: "Brama dwuskrzydłowa SLAB FENCE",
      series: "slab-fence",
      unitPrice,
      quantity: Math.max(quantity, 1),
      config: {
        variant,
        system: "Slab Fence",
        heightLabel,
        widthMm,
        standardWidths: "4000 / 5000 / 6000 mm",
        colorId: frameColorIdForCart,
        colorName: frameColorName,
        frameColorId: frameColorIdForCart,
        frameColorName,
        frameColorMode:
          frameColorMode === "standard" ? "standard" : "custom-ral",
        customRalCode:
          frameColorMode === "custom" && customRalCode
            ? customRalCode
            : undefined,
        finishId: selectedFinish.id,
        finishLabel: selectedFinish.label,
        hplId: selectedHpl.id,
        hplLabel: selectedHpl.label,
        hplGroup: selectedHpl.group,
        openingSide,
        hasAutomationPrep,
        hasLedInPosts,
        postSection: "100x100x2 mm",
        infillType: "płyta fasadowa HPL (Trespa)",
      },
    });
  };

  return (
    <>
      <section className="section">
        <div className="container space-y-10">
          {/* INTRO */}
          <header className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
              Seria SLAB FENCE – brama dwuskrzydłowa
            </p>
            <h1 className="text-[26px] md:text-[40px] font-extrabold text-accent uppercase">
              Brama dwuskrzydłowa SLAB FENCE – pełne wypełnienie z płyty HPL
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
              Brama dwuskrzydłowa SLAB FENCE to rozwiązanie dla inwestorów,
              którzy chcą zachować pełną prywatność i spójny front posesji.
              Stelaż wykonany jest z{" "}
              <strong>profili stalowych ocynkowanych</strong>, a wypełnienie
              stanowią płyty fasadowe HPL w dekorach Trespa. W standardzie
              otrzymujesz{" "}
              <strong>
                2 słupy 100×100×2&nbsp;mm, zawiasy regulowane, zamek
              </strong>
              , z możliwością przygotowania pod automatykę.
            </p>
          </header>

          {/* MODEL 3D + KONFIGURATOR */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,3fr)] items-start">
            {/* MODEL */}
            <div className="space-y-4">
              <SlabBramadwuskrzydlowaModel
                colorHex={previewFrameColorHex}
                finish={finishId}
                panelTextureUrl={previewPanelTexture}
                panelLabel={selectedHpl.label}
              />

              <div className="rounded-3xl bg-white/80 border border-border p-4 text-[12px] text-neutral-700 space-y-1">
                <p>
                  W komplecie:{" "}
                  <strong>
                    2 słupy 100×100×2&nbsp;mm, zawiasy regulowane, zamek
                  </strong>{" "}
                  oraz możliwość przygotowania pod automatykę i fotokomórki.
                </p>
                <p className="text-[11px] text-neutral-500">
                  Model 3D ma charakter poglądowy – wiążące są parametry
                  wprowadzone w konfiguratorze oraz dokumentacja techniczna.
                </p>
              </div>
            </div>

            {/* KONFIGURATOR */}
            <div className="rounded-3xl border border-border bg-white/80 p-5 md:p-6 space-y-6 shadow-soft">
              <h2 className="text-[18px] md:text-[20px] font-bold text-primary mb-1">
                Konfigurator bramy dwuskrzydłowej SLAB FENCE
              </h2>

              {/* pasek kroków */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {steps.map((s, index) => {
                  const isActive = step === s.id;
                  const isCompleted = step > s.id;
                  const Icon = s.icon;

                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 flex-none"
                    >
                      <button
                        type="button"
                        onClick={() => setStep(s.id)}
                        className="flex flex-col items-center gap-1 focus:outline-none"
                      >
                        <div
                          className={[
                            "flex h-9 w-9 items-center justify-center rounded-full border text-[16px] transition-colors",
                            isActive &&
                              "bg-accent text-white border-accent shadow-soft",
                            !isActive &&
                              isCompleted &&
                              "bg-accent/10 text-accent border-accent/60",
                            !isActive &&
                              !isCompleted &&
                              "bg-white/60 text-primary/40 border-border/70",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <Icon />
                        </div>
                        <span
                          className={[
                            "text-[9px] font-semibold tracking-[0.16em] uppercase text-center",
                            isActive
                              ? "text-primary"
                              : "text-neutral-500/70",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {s.label}
                        </span>
                      </button>

                      {index < steps.length - 1 && (
                        <FaChevronRight
                          className={
                            "text-xs flex-none " +
                            (step > s.id
                              ? "text-accent"
                              : "text-neutral-400/70")
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* KROK 1 – PŁYTA */}
              {step === 1 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 1 · Wzór płyty fasadowej
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {hplPatterns.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setHplId(p.id)}
                        className={`flex flex-col items-start gap-1 rounded-2xl border px-3 py-2 text-left text-[12px] ${
                          hplId === p.id
                            ? "bg-accent text-white border-accent"
                            : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-[0.16em] opacity-80">
                          {p.group}
                        </span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Te same dekory możesz wykorzystać na przęsłach i furtce, aby
                    uzyskać jednolity front posesji.
                  </p>

                  <Link
                    href="https://www.trespa.com/pl_PL/sample-selector"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-accent/70 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent hover:bg-accent hover:text-white hover:border-accent transition-colors"
                  >
                    Zobacz pełną paletę dekorów Trespa HPL
                  </Link>
                </section>
              )}

              {/* KROK 2 – KOLOR I STRUKTURA */}
              {step === 2 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 2 · Kolor stelaża i struktura
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {baseColors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setFrameColorMode("standard");
                          setFrameColorId(c.id);
                        }}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-1 text-[12px] ${
                          frameColorMode === "standard" &&
                          frameColorId === c.id
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

                    <button
                      type="button"
                      onClick={() => setFrameColorMode("custom")}
                      className={`px-3 py-1 rounded-2xl border text-[12px] ${
                        frameColorMode === "custom"
                          ? "bg-accent text-white border-accent"
                          : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                      }`}
                    >
                      Dowolny kolor RAL (+dopłata)
                    </button>
                  </div>

                  {frameColorMode === "custom" && (
                    <div className="flex flex-col gap-2 max-w-xs">
                      <input
                        type="text"
                        value={customRalCode}
                        onChange={(e) => setCustomRalCode(e.target.value)}
                        placeholder="np. 7021, 9007, 8019..."
                        className="rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                      <p className="text-[11px] text-neutral-500">
                        Możliwe wszystkie kolory z palety RAL. Dopłata zależy
                        od wybranego odcienia i struktury.
                      </p>

                      <Link
                        href="https://www.ralcolorchart.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl border border-accent/70 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent hover:bg-accent hover:text-white hover:border-accent transition-colors"
                      >
                        Zobacz pełną paletę RAL
                      </Link>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      Struktura powłoki
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {finishOptions.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFinishId(f.id)}
                          className={`px-3 py-1 rounded-full border text-[12px] ${
                            finishId === f.id
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span className="relative h-6 w-6 rounded-full overflow-hidden border border-white/70">
                              <Image
                                src={f.swatch}
                                alt={f.label}
                                fill
                                className="object-cover"
                              />
                            </span>
                            <span>{f.label}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Stelaż malujemy proszkowo w strukturze mat lub drobny
                      brokat – odporna powłoka na warunki zewnętrzne.
                    </p>
                  </div>
                </section>
              )}

              {/* KROK 3 – WYMIARY */}
              {step === 3 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 3 · Wymiary bramy
                  </p>
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
                      Wymiary standardowe
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
                      Na wymiar (3500 zł/mb)
                    </button>
                  </div>

                  {variant === "standard" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-[12px] font-semibold text-primary mb-1">
                          Wysokość bramy
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
                          Szerokość światła wjazdu (oba skrzydła)
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
                          min={130}
                          max={220}
                          value={customHeight}
                          onChange={(e) =>
                            setCustomHeight(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        />
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Typowy zakres: 150–200 cm. Ostateczne wymiary
                          doprecyzujemy na etapie projektu.
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-primary mb-1">
                          Szerokość światła wjazdu (cm)
                        </p>
                        <input
                          type="number"
                          min={300}
                          max={800}
                          value={customWidth}
                          onChange={(e) =>
                            setCustomWidth(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        />
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Standardowo 4000 / 5000 / 6000 mm. Na wymiar bramę
                          wyceniamy orientacyjnie wg stawki{" "}
                          <strong>3500 zł/mb szerokości światła wjazdu</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* KROK 4 – AUTOMATYKA / WYPOSAŻENIE */}
              {step === 4 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 4 · Automatyka i wyposażenie
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[12px] font-semibold text-primary mb-1">
                        Skrzydło czynne
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(["left", "right"] as const).map((side) => (
                          <button
                            key={side}
                            type="button"
                            onClick={() => setOpeningSide(side)}
                            className={`px-3 py-1 rounded-full border text-[12px] ${
                              openingSide === side
                                ? "bg-accent text-white border-accent"
                                : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                            }`}
                          >
                            {side === "left"
                              ? "Skrzydło czynne lewe"
                              : "Skrzydło czynne prawe"}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Stronę skrzydła czynnego ustalamy względem patrzenia od
                        strony posesji.
                      </p>
                    </div>

                    <div>
                      <p className="text-[12px] font-semibold text-primary mb-1">
                        Wyposażenie dodatkowe
                      </p>
                      <div className="space-y-2 text-[12px] text-neutral-800">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={hasAutomationPrep}
                            onChange={(e) =>
                              setHasAutomationPrep(e.target.checked)
                            }
                          />
                          <span>
                            Przygotowanie pod automatykę (płytki, odboje,
                            okablowanie)
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={hasLedInPosts}
                            onChange={(e) =>
                              setHasLedInPosts(e.target.checked)
                            }
                          />
                          <span>Opcja LED / podświetlenie słupów</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500">
                    Na etapie projektu dopasujemy konkretny zestaw automatyki
                    (siłowniki, centrale, akcesoria) do szerokości wjazdu,
                    intensywności pracy i warunków zabudowy.
                  </p>
                </section>
              )}

              {/* KROK 5 – PODSUMOWANIE */}
              {step === 5 && (
                <section className="space-y-5 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 5 · Ilość i podsumowanie
                  </p>

                  <div className="flex items-center gap-3">
                    <p className="text-[12px] font-semibold text-primary">
                      Ilość bram
                    </p>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-20 rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent text-center"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="text-[13px] text-neutral-700 space-y-1">
                      <p>
                        Cena jednostkowa:{" "}
                        <strong className="text-primary">
                          {priceLabel}
                        </strong>
                      </p>
                      <p>
                        Ilość:{" "}
                        <strong className="text-primary">
                          {quantity} szt.
                        </strong>
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">
                        Cena uwzględnia wybrany dekor Trespa, kolor i strukturę
                        stelaża, wymiary bramy (w tym wycenę na wymiar wg 3500
                        zł/mb), przygotowanie pod automatykę oraz wyposażenie
                        dodatkowe. Ma charakter orientacyjny – wiążącą ofertę
                        przygotujemy po analizie projektu i warunków montażu.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                        Razem orientacyjnie
                      </p>
                      <p className="text-[20px] font-extrabold text-primary">
                        {totalLabel}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-neutral-50/80 border border-border/70 p-3 md:p-4 text-[12px] text-neutral-700 space-y-1">
                    <p className="font-semibold text-primary">
                      Co dalej po dodaniu do koszyka?
                    </p>
                    <p>
                      Po zebraniu konfiguracji bramy, furtek i przęseł SLAB
                      FENCE przygotujemy kompletną wycenę z rysunkami
                      technicznymi, doborem automatyki i detali montażu.
                    </p>
                  </div>
                </section>
              )}

              {/* NAV DÓŁ */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={step === 1}
                  className={`px-4 py-2 rounded-2xl border text-[11px] uppercase tracking-[0.14em] ${
                    step === 1
                      ? "border-border text-neutral-400 cursor-not-allowed"
                      : "border-border text-primary hover:border-accent hover:text-accent"
                  }`}
                >
                  Wstecz
                </button>

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2 rounded-2xl bg-accent text-white text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-accent/90"
                  >
                    Dalej
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="btn btn-sm px-6 py-2 rounded-2xl w-auto justify-center text-[11px] uppercase tracking-[0.18em]"
                  >
                    Dodaj konfigurację bramy do koszyka
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OPISY POD KONFIGURATOREM */}
          <section className="space-y-3">
            <h2 className="text-[20px] md:text-[30px] font-extrabold text-accent uppercase text-center">
              Jak działa system SLAB FENCE przy bramie dwuskrzydłowej?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800 text-center max-w-4xl mx-auto">
              Panele SLAB FENCE z płyt fasadowych HPL tworzą jednolitą
              płaszczyznę, która płynnie przechodzi przez przęsła, furtkę i
              bramę dwuskrzydłową. Brama zachowuje ten sam podział i wysokość co
              ogrodzenie, dzięki czemu cała linia frontu jest spójna i daje
              efekt pełnej, eleganckiej bariery wizualnej.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[14px] md:text-[18px] font-bold text-accent text-center">
              Rysunek techniczny bramy dwuskrzydłowej SLAB FENCE
            </h2>
            <div className="relative mx-auto w-full max-w-5xl aspect-[77/54] rounded-3xl overflow-hidden shadow-soft bg-white/70">
              <Image
                src="/products/slab-fence-brama-dwuskrzydlowa-tech.png"
                alt="Rysunek techniczny bramy dwuskrzydłowej SLAB FENCE"
                fill
                className="object-contain object-center"
              />
            </div>
          </section>

          <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
            <div className="space-y-3">
              <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
                Montaż i integracja z ogrodzeniem
              </h2>
              <p className="text-[14px] md:text-[15px] text-neutral-800">
                Brama dwuskrzydłowa SLAB FENCE montowana jest na słupach
                100×100×2&nbsp;mm osadzonych w fundamencie punktowym lub na
                stopach stalowych. Stelaż jest przygotowany do współpracy z
                napędami do bram skrzydłowych, fotokomórkami, odbojami i
                akcesoriami bezpieczeństwa. W jednej linii można zestawić bramę
                z furtką i przęsłami z tej samej kolekcji.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-transparent">
              <Image
                src="/products/slab-fence-brama-dwuskrzydlowa.jpg"
                alt="Brama dwuskrzydłowa SLAB FENCE"
                fill
                className="object-cover object-center"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
              Dla kogo jest brama dwuskrzydłowa SLAB FENCE?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800">
              Ten model wybierany jest przy nowoczesnych domach jednorodzinnych,
              rezydencjach, osiedlach premium i obiektach usługowych, gdzie
              liczy się pełna prywatność oraz minimalistyczna, monolityczna
              linia ogrodzenia. Konfigurator online pozwala szybko zebrać dane
              do wyceny, doboru automatyki i przygotowania dokumentacji
              wykonawczej.
            </p>
          </section>
        </div>
      </section>

      {/* HERO SLIDER */}
      <section className="mt-8 border-t border-border">
        <HeroSlider />
      </section>

      {/* MATERIAŁY POMOCNICZE */}
      <section className="section">
        <div className="container space-y-4">
          <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase text-center">
            Materiały pomocnicze
          </h2>
          <div className="grid gap-4 md:grid-cols-3 text-[13px] md:text-[14px]">
            <Link
              href="https://www.trespa.com/pl_PL/sample-selector"
              target="_blank"
              rel="noreferrer"
              className="rounded-3xl bg-accent border border-border p-4 shadow-soft hover:border-accent hover:text-accent transition-colors"
            >
              <p className="font-bold mb-1 uppercase text-center text-white">
                Wzory płyt Trespa HPL
              </p>
              <p className="text-white text-center">
                Przeglądaj pełną paletę dekorów Trespa i wybieraj wzory dla
                bramy, furtek i przęseł.
              </p>
            </Link>
            <Link
              href="/pliki/katalog-produktowy-2024-25.pdf"
              className="rounded-3xl bg-white/80 border border-border p-4 shadow-soft hover:border-accent hover:text-accent transition-colors"
            >
              <p className="font-bold mb-1 text-center uppercase">
                Katalog produktowy NAGET 2024/25
              </p>
              <p className="text-neutral-700 text-center">
                Pełna specyfikacja ogrodzeń pionowych, SLAB FENCE, ROYAL oraz
                akcesoriów.
              </p>
            </Link>
            <Link
              href="/warunki-gwarancji"
              className="rounded-3xl bg-accent border border-border p-4 shadow-soft hover:border-accent hover:text-accent transition-colors"
            >
              <p className="font-bold mb-1 uppercase text-center text-white">
                Warunki gwarancji
              </p>
              <p className="text-neutral-700 text-center text-white">
                Szczegóły gwarancji na konstrukcje bram i ogrodzeń NAGET.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
