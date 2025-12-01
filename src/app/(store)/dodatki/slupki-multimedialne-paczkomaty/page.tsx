"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FaBorderAll,
  FaRulerCombined,
  FaPalette,
  FaClipboardCheck,
  FaChevronRight,
} from "react-icons/fa";

import { useCart } from "../../../CartContext";
import HeroSlider from "../../../components/HeroSlider";
import SlupekMultiModel from "../../../components/Slupekmultimodel";

/**
 * KONFIGURATOR – SŁUPKI MULTIMEDIALNE
 * ----------------------------------------------------
 */

const basePrice = 5200; // orientacyjna cena bazowa słupka multimedialnego

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

const bodyVariants = [
  {
    id: "steel-ral",
    label: "Blacha ocynkowana + RAL",
    description:
      "Korpus z blachy ocynkowanej malowanej proszkowo – minimalistyczny słupek jednokolorowy.",
    factor: 1.0,
  },
  {
    id: "full-hpl",
    label: "Stelaż metalowy + płyta elewacyjna na całości",
    description:
      "Metalowy stelaż obłożony płytą elewacyjną na wszystkich bokach – efekt monolitu w wybranym wzorze.",
    factor: 1.18,
  },
  {
    id: "hpl-glass-front",
    label: "Stelaż + płyta elewacyjna boki/tył, front szkło",
    description:
      "Boki i tył w płycie elewacyjnej, front z bezpiecznego szkła (białe lub czarne).",
    factor: 1.22,
  },
] as const;

const facadePatterns = [
  {
    id: "na17-natural-graphite",
    label: "Natural Graphite (Trespa® NA17)",
    texture: "/slabfence/na17-natural-graphite.jpg",
    factor: 1.06,
  },
  {
    id: "nm04-sintered-alloy",
    label: "Sintered Alloy (Trespa® NM04)",
    texture: "/slabfence/nm04-sintered-alloy.jpg",
    factor: 1.07,
  },
  {
    id: "nw18-light-mahogany",
    label: "Light Mahogany (Trespa® NW18)",
    texture: "/slabfence/nw18-light-mahogany.jpg",
    factor: 1.05,
  },
] as const;

const glassColors = [
  { id: "white", label: "Szkło bezpieczne – białe" },
  { id: "black", label: "Szkło bezpieczne – czarne" },
] as const;

const standardSize = {
  heightCm: 170,
  widthCm: 35,
  depthCm: 30,
  label: "ok. 170 × 35 × 30 cm (wymiary katalogowe – do doprecyzowania w projekcie)",
};

type FinishOption = (typeof finishOptions)[number];
type FinishId = FinishOption["id"];

type BodyVariantId = (typeof bodyVariants)[number]["id"];
type FacadePatternId = (typeof facadePatterns)[number]["id"];
type GlassColorId = (typeof glassColors)[number]["id"];

type Variant = "standard" | "custom";
type ColorMode = "standard" | "custom";

type Step = 1 | 2 | 3 | 4;

type StepDef = {
  id: Step;
  label: string;
  icon: IconType;
};

export default function SlupkiMultimedialnePage() {
  const { addItem } = useCart();

  const [step, setStep] = useState<Step>(1);

  const steps: StepDef[] = [
    { id: 1, label: "Korpus i materiał", icon: FaBorderAll },
    { id: 2, label: "Wymiary", icon: FaRulerCombined },
    { id: 3, label: "Wyposażenie i kolor", icon: FaPalette },
    { id: 4, label: "Podsumowanie", icon: FaClipboardCheck },
  ];

  const handleNextStep = () =>
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  const handlePrevStep = () =>
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  // STEP 1 – korpus / materiał
  const [bodyVariantId, setBodyVariantId] =
    useState<BodyVariantId>("steel-ral");
  const [facadePatternId, setFacadePatternId] =
    useState<FacadePatternId>("na17-natural-graphite");
  const [glassColorId, setGlassColorId] =
    useState<GlassColorId>("black");

  // STEP 2 – wymiary
  const [variant, setVariant] = useState<Variant>("standard");
  const [customHeight, setCustomHeight] = useState<number | "">("");
  const [customWidth, setCustomWidth] = useState<number | "">("");
  const [customDepth, setCustomDepth] = useState<number | "">("");

  // STEP 3 – kolor / wyposażenie
  const [colorMode, setColorMode] = useState<ColorMode>("standard");
  const [colorId, setColorId] = useState<string>(baseColors[1].id);
  const [customRalCode, setCustomRalCode] = useState<string>("");
  const [finishId, setFinishId] = useState<FinishId>("mat");

  const [hasMailbox] = useState<boolean>(true); // standard – zawsze
  const [hasIntercom, setHasIntercom] = useState<boolean>(false);
  const [hasVideoIntercom, setHasVideoIntercom] =
    useState<boolean>(false);
  const [hasHouseNumber, setHasHouseNumber] = useState<boolean>(true);
  const [hasStreetName, setHasStreetName] = useState<boolean>(false);
  const [hasLedBacklight, setHasLedBacklight] = useState<boolean>(false);
  const [hasParcelBox, setHasParcelBox] = useState<boolean>(false);

  const [note, setNote] = useState<string>("");

  const [quantity, setQuantity] = useState<number>(1);

  const selectedBodyVariant =
    bodyVariants.find((b) => b.id === bodyVariantId) ?? bodyVariants[0];

  const selectedFacadePattern =
    facadePatterns.find((p) => p.id === facadePatternId) ??
    facadePatterns[0];

  const selectedGlassColor =
    glassColors.find((g) => g.id === glassColorId) ?? glassColors[0];

  const selectedBaseColor =
    baseColors.find((c) => c.id === colorId) ?? baseColors[1];

  const selectedFinish =
    finishOptions.find((f) => f.id === finishId) ?? finishOptions[0];

  const previewColorHex =
    colorMode === "standard" ? selectedBaseColor.hex : "#383E4A";

  // CENA – orientacyjna
  const { unitPrice, priceLabel, totalLabel } = useMemo(() => {
    let factor = 1.0;

    factor *= selectedBodyVariant.factor;
    factor *= selectedFinish.factor;

    if (bodyVariantId !== "steel-ral" && selectedFacadePattern) {
      factor *= selectedFacadePattern.factor;
    }

    if (bodyVariantId === "hpl-glass-front") {
      factor *= 1.05; // szkło z przodu
    }

    if (colorMode === "custom") {
      factor *= 1.05;
    }

    // wymiary
    const h =
      variant === "standard"
        ? standardSize.heightCm
        : typeof customHeight === "number" && customHeight > 0
        ? customHeight
        : standardSize.heightCm;

    const w =
      variant === "standard"
        ? standardSize.widthCm
        : typeof customWidth === "number" && customWidth > 0
        ? customWidth
        : standardSize.widthCm;

    const d =
      variant === "standard"
        ? standardSize.depthCm
        : typeof customDepth === "number" && customDepth > 0
        ? customDepth
        : standardSize.depthCm;

    const baseArea =
      (standardSize.heightCm * standardSize.widthCm) / 10000; // m² frontu
    const currentArea = (h * w) / 10000;
    const areaFactor = currentArea / baseArea;
    factor *= 0.5 + 0.5 * areaFactor;

    // wyposażenie
    if (hasMailbox) {
      factor *= 1.02; // skrzynka w standardzie, ale lekka korekta
    }
    if (hasIntercom) factor *= 1.12;
    if (hasVideoIntercom) factor *= 1.25;
    if (hasHouseNumber) factor *= 1.03;
    if (hasStreetName) factor *= 1.05;
    if (hasLedBacklight) factor *= 1.07;
    if (hasParcelBox) factor *= 1.15;

    let price = Math.round(basePrice * factor);
    if (!Number.isFinite(price) || price <= 0) {
      price = basePrice;
    }

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
    selectedBodyVariant.factor,
    selectedFinish.factor,
    selectedFacadePattern?.factor,
    bodyVariantId,
    colorMode,
    variant,
    customHeight,
    customWidth,
    customDepth,
    hasMailbox,
    hasIntercom,
    hasVideoIntercom,
    hasHouseNumber,
    hasStreetName,
    hasLedBacklight,
    hasParcelBox,
    quantity,
  ]);

  // DODANIE DO KOSZYKA
  const handleAddToCart = () => {
    const heightCm =
      variant === "standard"
        ? standardSize.heightCm
        : typeof customHeight === "number"
        ? customHeight
        : standardSize.heightCm;

    const widthCm =
      variant === "standard"
        ? standardSize.widthCm
        : typeof customWidth === "number"
        ? customWidth
        : standardSize.widthCm;

    const depthCm =
      variant === "standard"
        ? standardSize.depthCm
        : typeof customDepth === "number"
        ? customDepth
        : standardSize.depthCm;

    const colorName =
      colorMode === "standard"
        ? selectedBaseColor.label
        : customRalCode
        ? `RAL ${customRalCode}`
        : "Dowolny kolor RAL (dopłata)";

    const colorIdForCart =
      colorMode === "standard"
        ? selectedBaseColor.id
        : customRalCode || "custom-ral";

    addItem({
      productId: "addons-slupki-multimedialne",
      name: "Słupek multimedialny",
      series: "addons",
      unitPrice,
      quantity: Math.max(quantity, 1),
      config: {
        variant,
        heightCm,
        widthCm,
        depthCm,
        sizeLabel: standardSize.label,
        bodyVariantId: selectedBodyVariant.id,
        bodyVariantLabel: selectedBodyVariant.label,
        facadePatternId:
          bodyVariantId === "steel-ral"
            ? undefined
            : selectedFacadePattern?.id,
        facadePatternLabel:
          bodyVariantId === "steel-ral"
            ? undefined
            : selectedFacadePattern?.label,
        glassColorId:
          bodyVariantId === "hpl-glass-front"
            ? selectedGlassColor.id
            : undefined,
        glassColorLabel:
          bodyVariantId === "hpl-glass-front"
            ? selectedGlassColor.label
            : undefined,
        colorMode: colorMode === "standard" ? "standard" : "custom-ral",
        colorId: colorIdForCart,
        colorName,
        customRalCode:
          colorMode === "custom" && customRalCode ? customRalCode : undefined,
        finishId: selectedFinish.id,
        finishLabel: selectedFinish.label,
        hasMailbox,
        hasIntercom,
        hasVideoIntercom,
        hasHouseNumber,
        hasStreetName,
        hasLedBacklight,
        hasParcelBox,
        note: note || undefined,
      },
    });
  };

  return (
    <>
      {/* GŁÓWNA SEKCJA */}
      <section className="section">
        <div className="container space-y-10">
          {/* INTRO */}
          <header className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
              Dodatki – słupki multimedialne
            </p>
            <h1 className="text-[26px] md:text-[40px] font-extrabold text-accent uppercase">
              Słupek multimedialny – centrum dowodzenia w ogrodzeniu
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
              Słupek multimedialny łączy w sobie przelotową skrzynkę na
              listy, domofon lub wideofon, przydomowy „mini paczkomat” oraz
              eleganckie oznaczenie numeru domu i nazwy ulicy – również w
              wersji z podświetleniem LED. Poza walorami praktycznymi stanowi
              dopełnienie frontowej części posesji i spina wszystkie funkcje
              wejścia w jednym punkcie.
            </p>
          </header>

          {/* 2 KOLUMNY – MODEL + KONFIGURATOR */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,3fr)] items-start">
            {/* LEWA – MODEL 3D */}
            <div className="space-y-4">
              <SlupekMultiModel
                colorHex={previewColorHex}
                finish={finishId}
              />

              <p className="text-[11px] text-neutral-600">
                Podgląd przedstawia słupek multimedialny o wymiarach
                katalogowych, z wybranym wariantem korpusu oraz kolorem
                konstrukcji. Wyposażenie (skrzynka, domofon, oznaczenia)
                dobierzesz w kolejnych krokach.
              </p>
            </div>

            {/* PRAWA – KONFIGURATOR */}
            <div className="rounded-3xl border border-border bg-white/80 p-5 md:p-6 space-y-6 shadow-soft">
              <h2 className="text-[18px] md:text-[20px] font-bold text-primary mb-1">
                Konfigurator słupka multimedialnego
              </h2>

              {/* PASEK KROKÓW */}
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

              {/* KROK 1 – KORPUS I MATERIAŁ */}
              {step === 1 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 1 · Korpus słupka i materiał wykończenia
                  </p>

                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      Wariant konstrukcji
                    </p>
                    <div className="space-y-2">
                      {bodyVariants.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBodyVariantId(b.id)}
                          className={`w-full text-left rounded-2xl border px-3 py-2 text-[12px] ${
                            bodyVariantId === b.id
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          <span className="block font-semibold">
                            {b.label}
                          </span>
                          <span className="block text-[11px] opacity-80">
                            {b.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(bodyVariantId === "full-hpl" ||
                    bodyVariantId === "hpl-glass-front") && (
                    <div className="space-y-2">
                      <p className="text-[12px] font-semibold text-primary">
                        Wzór płyty elewacyjnej (HPL / płyta fasadowa)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {facadePatterns.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setFacadePatternId(p.id)}
                            className={`flex items-center gap-2 rounded-2xl border px-3 py-1 text-[12px] ${
                              facadePatternId === p.id
                                ? "bg-accent text-white border-accent"
                                : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                            }`}
                          >
                            <span className="relative h-6 w-6 rounded-full overflow-hidden border border-white/70">
                              <Image
                                src={p.texture}
                                alt={p.label}
                                fill
                                className="object-cover"
                              />
                            </span>
                            <span>{p.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Płyty fasadowe są odporne na UV, wilgoć i uszkodzenia
                        mechaniczne. Wzór możesz dobrać do elewacji lub
                        ogrodzenia.
                      </p>
                    </div>
                  )}

                  {bodyVariantId === "hpl-glass-front" && (
                    <div className="space-y-2">
                      <p className="text-[12px] font-semibold text-primary">
                        Kolor szkła frontowego
                      </p>
                      <div className="flex flex-wrap gap-2 text-[12px]">
                        {glassColors.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setGlassColorId(g.id)}
                            className={`px-3 py-1 rounded-full border ${
                              glassColorId === g.id
                                ? "bg-accent text-white border-accent"
                                : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* KROK 2 – WYMIARY */}
              {step === 2 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 2 · Wymiary słupka
                  </p>

                  <div className="flex flex-wrap gap-3 text-[12px]">
                    <button
                      type="button"
                      onClick={() => setVariant("standard")}
                      className={`px-4 py-2 rounded-2xl border uppercase tracking-[0.14em] ${
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
                      className={`px-4 py-2 rounded-2xl border uppercase tracking-[0.14em] ${
                        variant === "custom"
                          ? "bg-accent text-white border-accent"
                          : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                      }`}
                    >
                      Na wymiar
                    </button>
                  </div>

                  {variant === "standard" ? (
                    <div className="text-[12px] text-neutral-700 space-y-1">
                      <p>
                        Wysokość:{" "}
                        <strong>{standardSize.heightCm} cm</strong>
                      </p>
                      <p>
                        Szerokość:{" "}
                        <strong>{standardSize.widthCm} cm</strong>
                      </p>
                      <p>
                        Głębokość:{" "}
                        <strong>{standardSize.depthCm} cm</strong>
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        {standardSize.label}. Przy projektach
                        indywidualnych wybierz opcję „Na wymiar”.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3 text-[12px]">
                      <div>
                        <p className="font-semibold text-primary mb-1">
                          Wysokość (cm)
                        </p>
                        <input
                          type="number"
                          min={140}
                          max={250}
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
                      </div>
                      <div>
                        <p className="font-semibold text-primary mb-1">
                          Szerokość (cm)
                        </p>
                        <input
                          type="number"
                          min={25}
                          max={60}
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
                      </div>
                      <div>
                        <p className="font-semibold text-primary mb-1">
                          Głębokość (cm)
                        </p>
                        <input
                          type="number"
                          min={20}
                          max={60}
                          value={customDepth}
                          onChange={(e) =>
                            setCustomDepth(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <p className="md:col-span-3 text-[11px] text-neutral-500">
                        Dla wymiarów niestandardowych przygotujemy rysunki
                        techniczne oraz indywidualną wycenę fundamentu /
                        posadowienia.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* KROK 3 – WYPOSAŻENIE I KOLOR */}
              {step === 3 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 3 · Wyposażenie oraz kolor
                  </p>

                  {/* Kolor + struktura */}
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      Kolor RAL konstrukcji
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {baseColors.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setColorMode("standard");
                            setColorId(c.id);
                          }}
                          className={`flex items-center gap-2 rounded-2xl border px-3 py-1 text-[12px] ${
                            colorMode === "standard" && colorId === c.id
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
                        onClick={() => setColorMode("custom")}
                        className={`px-3 py-1 rounded-2xl border text-[12px] ${
                          colorMode === "custom"
                            ? "bg-accent text-white border-accent"
                            : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                        }`}
                      >
                        Dowolny kolor RAL (+dopłata)
                      </button>
                    </div>

                    {colorMode === "custom" && (
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
                          od wybranego odcienia i typu wykończenia.
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
                    </div>
                  </div>

                  {/* Wyposażenie */}
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      Wyposażenie słupka
                    </p>
                    <div className="grid gap-2 text-[12px]">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={hasMailbox}
                          readOnly
                        />
                        <span>
                          Przelotowa skrzynka na listy{" "}
                          <span className="text-[11px] text-neutral-500">
                            (wyposażenie standardowe)
                          </span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={hasIntercom}
                          onChange={(e) =>
                            setHasIntercom(e.target.checked)
                          }
                        />
                        <span>Domofon audio</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={hasVideoIntercom}
                          onChange={(e) =>
                            setHasVideoIntercom(e.target.checked)
                          }
                        />
                        <span>Wideodomofon</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={hasHouseNumber}
                          onChange={(e) =>
                            setHasHouseNumber(e.target.checked)
                          }
                        />
                        <span>Numer domu</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={hasStreetName}
                          onChange={(e) =>
                            setHasStreetName(e.target.checked)
                          }
                        />
                        <span>Nazwa ulicy</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={hasLedBacklight}
                          onChange={(e) =>
                            setHasLedBacklight(e.target.checked)
                          }
                        />
                        <span>Podświetlenie LED (nr domu / nazwa ulicy)</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={hasParcelBox}
                          onChange={(e) =>
                            setHasParcelBox(e.target.checked)
                          }
                        />
                        <span>Przydomowy „mini paczkomat” / skrytka paczkowa</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[12px] font-semibold text-primary">
                      Dodatkowe informacje dla projektanta (opcjonalnie)
                    </p>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Np. integracja z konkretnym systemem domofonowym, wymagana liczba przycisków, opis istniejącej instalacji..."
                    />
                  </div>
                </section>
              )}

              {/* KROK 4 – PODSUMOWANIE */}
              {step === 4 && (
                <section className="space-y-5 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 4 · Ilość i podsumowanie
                  </p>

                  <div className="flex items-center gap-3">
                    <p className="text-[12px] font-semibold text-primary">
                      Ilość słupków
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
                    <div className="text-[13px] text-neutral-700 space-y-1 max-w-xs">
                      <p>
                        Wariant korpusu:{" "}
                        <strong className="text-primary">
                          {selectedBodyVariant.label}
                        </strong>
                      </p>
                      {bodyVariantId !== "steel-ral" && (
                        <p>
                          Płyta elewacyjna:{" "}
                          <strong className="text-primary">
                            {selectedFacadePattern?.label}
                          </strong>
                        </p>
                      )}
                      {bodyVariantId === "hpl-glass-front" && (
                        <p>
                          Front:{" "}
                          <strong className="text-primary">
                            {selectedGlassColor.label}
                          </strong>
                        </p>
                      )}
                      <p className="mt-2">
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
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Cena ma charakter orientacyjny – końcowa oferta
                        uwzględni wybrane urządzenia domofonowe/wideodomofonowe,
                        producenta oraz sposób montażu.
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

                  <div className="mt-2 space-y-3 rounded-2xl bg-neutral-50/80 border border-border/70 p-3 md:p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Co dalej?
                    </p>
                    <p className="text-[12px] text-neutral-700">
                      Po dodaniu słupka multimedialnego do koszyka otrzymamy od
                      Ciebie komplet danych: wariant konstrukcji, wymiary,
                      wykończenie oraz wyposażenie. Na tej podstawie
                      przygotujemy projekt wykonawczy, dobierzemy urządzenia
                      (domofony, wideodomofony, skrzynki paczkowe) oraz
                      przygotujemy wiążącą wycenę wraz z montażem.
                    </p>
                  </div>
                </section>
              )}

              {/* NAWIGACJA DÓŁ KARTY */}
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

                {step < 4 ? (
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
                    Dodaj słupek do koszyka
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OPISY POD KONFIGURATOREM */}
          <section className="space-y-3">
            <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase text-center">
              Centrum dowodzenia przy wejściu
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800 text-center max-w-4xl mx-auto">
              Słupek multimedialny porządkuje wszystkie funkcje wejścia w jednym
              miejscu – pocztę, komunikację, oznaczenie adresu i odbiór
              przesyłek. Dzięki temu front posesji jest uporządkowany, a
              instalacje elektryczne i teletechniczne prowadzone są w jednym,
              przemyślanym elemencie.
            </p>
          </section>

          <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
            <div className="space-y-3">
              <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
                Spójność z ogrodzeniem i automatyką
              </h2>
              <p className="text-[14px] md:text-[15px] text-neutral-800">
                Słupek multimedialny projektujemy tak, aby kolorystycznie i
                materiałowo pasował do ogrodzeń Stand Up, Slab Fence czy Royal
                oraz do zastosowanej automatyki bramowej. W jednym elemencie
                możemy zintegrować skrzynkę, wideodomofon, numer domu, nazwę
                ulicy i moduł paczkowy, a także przygotować miejsce pod
                sterowanie napędami FAAC, Nice, Somfy czy Vidos.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-neutral-100">
              <Image
                src="/products/addons-slupki-multi-detail.jpg"
                alt="Słupek multimedialny – detal"
                fill
                className="object-cover object-center"
              />
            </div>
          </section>
        </div>
      </section>

      {/* SLIDER HERO */}
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
              href="https://www.ralcolorchart.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-3xl bg-accent border border-border p-4 shadow-soft hover:border-accent hover:text-accent transition-colors"
            >
              <p className="font-bold mb-1 uppercase text-center text-white">
                Paleta kolorów RAL
              </p>
              <p className="text-white text-center">
                Dobierz kolor słupka do ogrodzenia, stolarki i dachu.
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
                Ogrodzenia, bramy, słupki multimedialne i dodatki w jednym
                dokumencie.
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
                Zasady gwarancji na konstrukcje stalowe/alu i wyposażenie
                elektroniczne.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
