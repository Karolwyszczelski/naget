"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../../CartContext";
import SlabBramaprzesuwnaModel from "../../../components/slab-bramaprzesuwnamodel";
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
 * KONFIG SLAB FENCE – BRAMA PRZESUWNA
 * ----------------------------------------------------
 */

// orientacyjna cena bazowa
const basePrice = 13900;

// wysokości / szerokości (światło w cm)
const standardHeights = [
  { id: "140", label: "140 cm" },
  { id: "150", label: "150 cm" },
  { id: "160", label: "160 cm" },
  { id: "180", label: "180 cm" },
];

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
    factor: 1.03,
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

export default function SlabFenceBramaPrzesuwnaPage() {
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
  const [heightId, setHeightId] = useState(standardHeights[2].id); // 160
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
  const [openingDirection, setOpeningDirection] = useState<"left" | "right">(
    "left"
  ); // kierunek otwierania
  const [hasAutomationPrep, setHasAutomationPrep] = useState(true);
  const [hasLedInPosts, setHasLedInPosts] = useState(false);
  const [hasTopGuidePost, setHasTopGuidePost] = useState(true);

  // ilość
  const [quantity, setQuantity] = useState(1);

  const selectedHeight =
    standardHeights.find((h) => h.id === heightId) ?? standardHeights[2];
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
    let factor = 1;

    factor *= selectedHpl.factor;
    factor *= selectedFinish.factor;

    if (frameColorMode === "custom") factor *= 1.08;

    if (variant === "standard") {
      const h = Number(selectedHeight.id);
      const w = Number(selectedWidth.id);
      const areaFactor = (h / 160) * 0.5 + (w / 500) * 0.6;
      factor *= 1 + areaFactor * 0.1;
    } else {
      const h = typeof customHeight === "number" ? customHeight : 0;
      const w = typeof customWidth === "number" ? customWidth : 0;
      if (h && w) {
        const areaFactor = (h / 160) * 0.5 + (w / 500) * 0.6;
        factor *= 1 + areaFactor * 0.12;
      }
    }

    let price = basePrice * factor;

    if (hasAutomationPrep) price += 1850; // wózki, najazd, listwy, przygotowanie pod napęd
    if (hasLedInPosts) price += 650;
    if (hasTopGuidePost) price += 420;

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
    customHeight,
    customWidth,
    hasAutomationPrep,
    hasLedInPosts,
    hasTopGuidePost,
    frameColorMode,
    quantity,
    selectedHpl.factor,
    selectedFinish.factor,
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
      productId: "slab-brama-przesuwna",
      name: "Brama przesuwna SLAB FENCE",
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
        openingDirection,
        hasAutomationPrep,
        hasLedInPosts,
        hasTopGuidePost,
        postSection: "80x80x2 mm",
        equipment:
          "2 słupy 80x80x2 mm, wózki, najazd, rolki prowadzące (wg konfiguracji)",
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
              Seria SLAB FENCE – brama przesuwna
            </p>
            <h1 className="text-[26px] md:text-[40px] font-extrabold text-accent uppercase">
              Brama przesuwna SLAB FENCE – pełna tafla z płyty HPL
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
              Brama przesuwna SLAB FENCE to połączenie{" "}
              <strong>pełnej prywatności</strong> z wygodą automatycznego
              wjazdu. Panele z płyt fasadowych HPL tworzą jednolitą ścianę,
              a stelaż oparty na profilach stalowych zapewnia sztywność całej
              konstrukcji. W standardzie otrzymujesz{" "}
              <strong>
                2 słupy 80×80×2&nbsp;mm, wózki, najazd i rolki prowadzące
              </strong>
              , gotowe do współpracy z napędem do bramy przesuwnej.
            </p>
          </header>

          {/* MODEL 3D + KONFIGURATOR */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,3fr)] items-start">
            {/* MODEL */}
            <div className="space-y-4">
              <SlabBramaprzesuwnaModel
                colorHex={previewFrameColorHex}
                finish={finishId}
                panelTextureUrl={previewPanelTexture}
              />

              <div className="rounded-3xl bg-white/80 border border-border p-4 text-[12px] text-neutral-700 space-y-1">
                <p>
                  W komplecie:{" "}
                  <strong>
                    2 słupy 80×80×2&nbsp;mm, wózki, najazd, rolki prowadzące
                  </strong>{" "}
                  oraz przygotowanie konstrukcji pod montaż napędu i
                  fotokomórek.
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
                Konfigurator bramy przesuwnej SLAB FENCE
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
                    Te same dekory możesz zastosować na przęsłach i furtce,
                    aby cały front ogrodzenia był spójny.
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
                    Krok 3 · Wymiary bramy przesuwnej
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
                      Na wymiar
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
                          Szerokość światła wjazdu
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
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Długość całkowita bramy (z przeciwwagą) będzie większa
                          od światła wjazdu – dopasujemy ją na etapie projektu.
                        </p>
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
                          Najczęściej 150–180 cm. Ostateczne wymiary
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
                          Standardowo 4000 / 5000 / 6000 mm. Inne szerokości
                          realizujemy jako projekt indywidualny.
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
                        Kierunek otwierania bramy
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(["left", "right"] as const).map((dir) => (
                          <button
                            key={dir}
                            type="button"
                            onClick={() => setOpeningDirection(dir)}
                            className={`px-3 py-1 rounded-full border text-[12px] ${
                              openingDirection === dir
                                ? "bg-accent text-white border-accent"
                                : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                            }`}
                          >
                            {dir === "left"
                              ? "Otwierana w lewo"
                              : "Otwierana w prawo"}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Kierunek określamy patrząc od strony posesji – ważne
                        przy planowaniu przeciwwagi i miejsca na odsuwanie
                        bramy.
                      </p>
                    </div>

                    <div>
                      <p className="text-[12px] font-semibold text-primary mb-1">
                        Wyposażenie zestawu
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
                            Przygotowanie pod automatykę + wózki, najazd, listwa
                            najazdowa
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={hasTopGuidePost}
                            onChange={(e) =>
                              setHasTopGuidePost(e.target.checked)
                            }
                          />
                          <span>Słupek z rolkami górnymi / prowadzącymi</span>
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
                    Na etapie projektu dobierzemy konkretny zestaw automatyki
                    (silnik, zębatka, fotokomórki, lampa, listwy bezpieczeństwa)
                    do ciężaru bramy, częstotliwości pracy i warunków zabudowy.
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
                        stelaża, wymiary bramy, przygotowanie pod automatykę
                        oraz wyposażenie dodatkowe. Ma charakter orientacyjny –
                        wiążącą ofertę przygotujemy po analizie projektu i
                        warunków montażu.
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
                      Po zebraniu konfiguracji bramy przesuwnej, furtek i
                      przęseł SLAB FENCE przygotujemy kompletną wycenę z
                      rysunkami technicznymi, doborem automatyki i szczegółami
                      montażu.
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
              Jak działa system SLAB FENCE przy bramie przesuwnej?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800 text-center max-w-4xl mx-auto">
              Brama przesuwna SLAB FENCE zachowuje ten sam podział i wysokość
              paneli co przęsła oraz furtka, dzięki czemu front posesji wygląda
              jak jedna, spokojna tafla. Pełne wypełnienie z płyt fasadowych
              HPL skutecznie odcina posesję od ulicy, a mechanizm przesuwny
              pozwala wygodnie korzystać z wjazdu nawet przy ograniczonej
              głębokości podjazdu.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[14px] md:text-[18px] font-bold text-accent text-center">
              Rysunek techniczny bramy przesuwnej SLAB FENCE
            </h2>
            <div className="relative mx-auto w-full max-w-5xl aspect-[77/54] rounded-3xl overflow-hidden shadow-soft bg-white/70">
              <Image
                src="/products/slab-fence-brama-przesuwna-tech.png"
                alt="Rysunek techniczny bramy przesuwnej SLAB FENCE"
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
                Brama przesuwna SLAB FENCE wymaga odpowiednio przygotowanego
                fundamentu pod wózki i przeciwwagę. W zestawie stosujemy
                wózki, najazd, rolki prowadzące oraz elementy montażowe,
                które dobieramy do szerokości wjazdu i wagi bramy. Brama może
                współpracować z tą samą automatyką, co pozostałe bramy na
                posesji, a panele z płyt HPL tworzą spójną całość z furtką i
                przęsłami.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-transparent">
              <Image
                src="/products/slab-fence-brama-przesuwna.jpg"
                alt="Brama przesuwna SLAB FENCE"
                fill
                className="object-cover object-center"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
              Dla kogo jest brama przesuwna SLAB FENCE?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800">
              Brama przesuwna SLAB FENCE sprawdzi się w inwestycjach, w których
              ważne są: pełna prywatność, nowoczesna estetyka oraz wygoda
              automatycznego wjazdu – od domów jednorodzinnych, przez rezydencje
              i osiedla, aż po obiekty usługowe. Konfigurator online pozwala
              szybko dobrać dekor Trespa, wymiary, kierunek otwierania oraz
              przygotowanie pod automatykę.
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
