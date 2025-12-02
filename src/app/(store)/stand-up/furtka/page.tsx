"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../../CartContext";
import HeroSlider from "../../../components/HeroSlider";
import FurtkaModel from "../../../components/FurtkaModel";
import type { IconType } from "react-icons";
import {
  FaBorderAll,
  FaSlidersH,
  FaRulerCombined,
  FaPalette,
  FaClipboardCheck,
  FaChevronRight,
} from "react-icons/fa";

/**
 * KONFIGURACJA DANYCH
 * ----------------------------------------------------
 */

const basePrice = 3200;

// standardowe wysokości / szerokości (światło przejścia)
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

// profile wypełnienia – dla uproszczenia wszystkie dostępne w PROSTYM i TWIST
const profiles = [
  { id: "60x40", label: "Profil 60×40 mm", factor: 1.0 },
  { id: "80x40", label: "Profil 80×40 mm", factor: 1.07 },
  { id: "80x80", label: "Profil 80×80 mm", factor: 1.15 },
];

// rozstaw (w przybliżeniu cm)
const spacingOptionsBase = [
  { id: "4", label: "ok. 4 cm – więcej prywatności", factor: 1.08 },
  { id: "6", label: "ok. 6 cm – standard", factor: 1.0 },
  { id: "9", label: "ok. 9 cm – bardziej ażurowe", factor: 0.95 },
];

// które rozstawy są dozwolone dla danego profilu
const spacingOptionsByProfile: Record<string, string[]> = {
  "60x40": ["4", "6", "9"],
  "80x40": ["4", "6", "9"],
  "80x80": ["6", "9"], // dla 80×80 brak bardzo gęstego rozstawu
};

// kąty obrotu TWIST
const twistAnglesByProfile: Record<string, number> = {
  "60x40": 45,
  "80x40": 45,
  "80x80": 15,
};

// bazowa paleta RAL bez dopłaty
const baseColors = [
  { id: "ral-7030", label: "RAL 7030 – jasny szary", hex: "#938C82" },
  { id: "ral-7016", label: "RAL 7016 – antracyt / grafit", hex: "#383E4A" },
  { id: "ral-9005", label: "RAL 9005 – czarny", hex: "#111111" },
  { id: "ral-8012", label: "RAL 8012 – miedziany brąz", hex: "#6B3B2A" },
  { id: "ral-8019", label: "RAL 8019 – ciemny brąz", hex: "#3D3635" },
  { id: "ral-7021", label: "RAL 7021 – ciemny grafit", hex: "#1F2421" },
];

// wykończenie powłoki
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

// zdjęcia dla PROSTEJ i TWIST
const variantImages: Record<"prosta" | "twist", string[]> = {
  prosta: [
    "/products/standup-furtka-prosta-main.jpg",
    "/products/standup-furtka-prosta-detail-1.jpg",
    "/products/standup-furtka-prosta-detail-2.jpg",
  ],
  twist: [
    "/products/standup-furtka-twist-main.jpg",
    "/products/standup-furtka-twist-detail-1.jpeg",
    "/products/standup-furtka-twist-detail-2.jpeg",
  ],
};

const upsellItems = [
  {
    id: "upsell-brama",
    name: "Brama przesuwna Stand Up",
    description:
      "Brama w tym samym rytmie profili co furtka – skonfiguruj w tej samej serii.",
    href: "/stand-up/brama-przesuwna",
    image: "/products/standup-brama.png",
    badge: "Brama przesuwna",
  },
  {
    id: "upsell-zadaszenie",
    name: "Zadaszenie nad furtkę Stand Up",
    description:
      "Zadaszenie wejścia dopasowane do profili furtki – ochrona przed deszczem i śniegiem.",
    href: "/stand-up/zadaszenie",
    image: "/products/standup-zadaszenie.gif",
    badge: "Zadaszenie",
  },
  {
    id: "upsell-slup",
    name: "Słupek multimedialny Stand Up",
    description:
      "Miejsce na skrzynkę, wideodomofon i automatykę – spójne z linią Stand Up.",
    href: "/stand-up/slupek-multimedialny",
    image: undefined,
    badge: "Słupek multimedialny",
  },
  {
    id: "upsell-automat",
    name: "Automatyka do bramy",
    description:
      "Napędy, fotokomórki i akcesoria dobrane do bram Naget – wygodne sterowanie.",
    href: "/dodatki/automatyka",
    image: "/products/addons-automat.png",
    badge: "Automatyka",
  },
];

export default function StandUpFurtkaPage() {
  const { addItem } = useCart();

  // krok w konfiguratorze
  const [step, setStep] = useState<Step>(1);

  const handleNextStep = () =>
    setStep((prev) => (prev < 5 ? ((prev + 1) as Step) : prev));

  const handlePrevStep = () =>
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  const steps: StepDef[] = [
    { id: 1, label: "Wypełnienie", icon: FaBorderAll },
    { id: 2, label: "Profil i rozstaw", icon: FaSlidersH },
    { id: 3, label: "Wymiary", icon: FaRulerCombined },
    { id: 4, label: "Kolor i struktura", icon: FaPalette },
    { id: 5, label: "Podsumowanie", icon: FaClipboardCheck },
  ];

  // tryb wymiarów
  const [variant, setVariant] = useState<"standard" | "custom">("standard");

  // standard
  const [heightId, setHeightId] = useState(standardHeights[0].id);
  const [widthId, setWidthId] = useState(standardWidths[0].id);

  // na wymiar
  const [customHeight, setCustomHeight] = useState<number | "">("");
  const [customWidth, setCustomWidth] = useState<number | "">("");

  // wypełnienie
  const [fillType, setFillType] = useState<"prosta" | "twist">("prosta");
  const [profileId, setProfileId] = useState<"60x40" | "80x40" | "80x80">(
    "60x40"
  );
  const [spacingId, setSpacingId] = useState<"4" | "6" | "9">("6");

  // kolor RAL + struktura
  const [colorMode, setColorMode] = useState<"standard" | "custom">(
    "standard"
  );
  const [colorId, setColorId] = useState<string>(baseColors[0].id);
  const [customRalCode, setCustomRalCode] = useState<string>("");
  const [finishId, setFinishId] = useState<FinishId>("mat");

  // ilość
  const [quantity, setQuantity] = useState(1);

  // aktywny widok w galerii (null = model 3D, string = ścieżka zdjęcia)
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);

  const selectedHeight =
    standardHeights.find((h) => h.id === heightId) ?? standardHeights[0];
  const selectedWidth =
    standardWidths.find((w) => w.id === widthId) ?? standardWidths[0];
  const selectedProfile =
    profiles.find((p) => p.id === profileId) ?? profiles[0];

  const availableSpacingOptions = useMemo(() => {
    let allowed =
      spacingOptionsByProfile[selectedProfile.id] ??
      spacingOptionsBase.map((s) => s.id);

    // DLA TWIST + profili 80×40 / 80×80 usuwamy rozstaw 9 cm
    if (
      fillType === "twist" &&
      (selectedProfile.id === "80x40" || selectedProfile.id === "80x80")
    ) {
      allowed = allowed.filter((id) => id !== "9");
    }

    return spacingOptionsBase.filter((s) => allowed.includes(s.id));
  }, [selectedProfile.id, fillType]);

  useEffect(() => {
    const allowedIds = availableSpacingOptions.map((s) => s.id);
    if (!allowedIds.includes(spacingId)) {
      setSpacingId(allowedIds[0] as "4" | "6" | "9");
    }
  }, [availableSpacingOptions, spacingId]);

  // przy zmianie PROSTA/TWIST resetujemy główne zdjęcie do modelu 3D
  useEffect(() => {
    setActiveImageSrc(null);
  }, [fillType]);

  const selectedSpacing =
    availableSpacingOptions.find((s) => s.id === spacingId) ??
    availableSpacingOptions[0];

  const selectedBaseColor =
    baseColors.find((c) => c.id === colorId) ?? baseColors[0];

  const selectedFinish =
    finishOptions.find((f) => f.id === finishId) ?? finishOptions[0];

  // kolor do podglądu (3D + overlay)
  const previewColorHex =
    colorMode === "standard" ? selectedBaseColor.hex : "#383E4A";

  // KALKULACJA CENY
  const { unitPrice, priceLabel, totalLabel } = useMemo(() => {
    let factor = 1.0;

    factor *= selectedProfile.factor;
    factor *= selectedSpacing.factor;
    factor *= selectedFinish.factor;

    if (variant === "custom") {
      const h = typeof customHeight === "number" ? customHeight : 0;
      const w = typeof customWidth === "number" ? customWidth : 0;

      if (h && w) {
        const areaFactor =
          (h / 160) * 0.4 + (w / 110) * 0.3; // korekta względem standardu
        factor *= 1 + areaFactor * 0.15;
      }
    }

    if (fillType === "twist") {
      factor *= 1.05;
    }

    if (colorMode === "custom") {
      factor *= 1.08;
    }

    let price = Math.round(basePrice * factor);
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
    fillType,
    colorMode,
    quantity,
    selectedProfile.factor,
    selectedSpacing.factor,
    selectedFinish.factor,
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

    const spacingCm = Number(selectedSpacing.id) || undefined;

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
      productId: "standup-furtka",
      name: "Furtka Stand Up",
      series: "stand-up",
      unitPrice,
      quantity: Math.max(quantity, 1),
      config: {
        variant,
        heightLabel,
        widthMm,
        colorId: colorIdForCart,
        colorName,
        colorMode: colorMode === "standard" ? "standard" : "custom-ral",
        customRalCode:
          colorMode === "custom" && customRalCode ? customRalCode : undefined,
        material: "aluminium",
        fillType,
        profileId: selectedProfile.id,
        profileLabel: selectedProfile.label,
        spacingCm,
        finishId: selectedFinish.id,
        finishLabel: selectedFinish.label,
      },
    });
  };

  // miniatury zdjęć
  const thumbs = variantImages[fillType].slice(1);
  const twistAngle = twistAnglesByProfile[profileId];

  const activeImageAlt =
    fillType === "prosta"
      ? "Furtka Stand Up – widok prosty"
      : "Furtka Stand Up Twist – widok";

  return (
    <>
      {/* SEKCJA GŁÓWNA PRODUKTU */}
      <section className="section">
        <div className="container space-y-10">
          {/* META / INTRO */}
          <header className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
              Seria Stand Up – furtka aluminiowa
            </p>
            <h1 className="text-[26px] md:text-[40px] font-extrabold text-accent uppercase">
              Furtka Stand Up – prosta i Twist, na wymiar i w standardzie
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
              Aluminiowa furtka z pionowych profili dopasowana do ogrodzeń
              Stand Up. Wybierz wariant prosty lub TWIST, dobierz profil,
              rozstaw, wymiary oraz kolor z palety RAL – także na indywidualny
              wymiar. Profile są spawane, szlifowane i malowane proszkowo, co
              zapewnia estetykę oraz wysoką odporność na warunki atmosferyczne.
            </p>
          </header>

          {/* UKŁAD 2 KOLUMN: PODGLĄD (3D / FOTO) + KONFIGURATOR */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,3fr)] items-start">
            {/* LEWA – MODEL 3D / ZDJĘCIE + MINIATURY */}
            <div className="space-y-4">
              <div className="relative w-full rounded-3xl overflow-hidden shadow-soft bg-transparent">
                {activeImageSrc ? (
                  <div className="relative w-full aspect-[4/3]">
                    <Image
                      src={activeImageSrc}
                      alt={activeImageAlt}
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                ) : (
                  <FurtkaModel
                    colorHex={previewColorHex}
                    finish={finishId}
                    profileId={profileId}
                    spacingId={spacingId}
                    fillType={fillType}
                  />
                )}

                {activeImageSrc && (
                  <button
                    type="button"
                    onClick={() => setActiveImageSrc(null)}
                    className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary shadow-soft hover:bg-white"
                  >
                    Pokaż model 3D
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {thumbs.map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImageSrc(src)}
                    className="relative h-28 rounded-2xl overflow-hidden shadow-soft bg-transparent"
                  >
                    <Image
                      src={src}
                      alt={
                        fillType === "prosta"
                          ? `Detal furtki Stand Up prostej ${idx + 1}`
                          : `Detal furtki Stand Up Twist ${idx + 1}`
                      }
                      fill
                      className="object-cover object-center"
                    />
                    <span className="absolute left-2 bottom-2 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {fillType === "prosta" ? "Prosty" : "Twist"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* PRAWA – WIZARD KROK-PO-KROKU */}
            <div className="rounded-3xl border border-border bg-white/80 p-5 md:p-6 space-y-6 shadow-soft">
              <h2 className="text-[18px] md:text-[20px] font-bold text-primary mb-1">
                Konfigurator furtki Stand Up
              </h2>

              {/* Pasek kroków – ikonki + strzałki */}
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

              {/* KROK 1 – WYPEŁNIENIE */}
              {step === 1 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 1 · Wypełnienie furtki
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["prosta", "twist"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFillType(type)}
                        className={`px-4 py-2 rounded-2xl border text-[12px] uppercase tracking-[0.14em] ${
                          fillType === type
                            ? "bg-accent text-white border-accent"
                            : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                        }`}
                      >
                        {type === "prosta"
                          ? "Stand Up Prosty"
                          : "Stand Up Twist"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[12px] text-neutral-700">
                    <strong>
                      {fillType === "prosta"
                        ? "Prosty"
                        : "Twist – efekt żaluzji:"}
                    </strong>{" "}
                    {fillType === "prosta"
                      ? "pionowe profile ustawione równolegle, bez obrotu – maksymalny minimalizm i czytelny rytm ogrodzenia."
                      : `aluminiowe lamelki są obrócone pod kątem ${
                          twistAngle ?? 45
                        }° względem osi profilu, co tworzy grę światła i cienia oraz zwiększa prywatność. Przestrzeń za ogrodzeniem widać tylko pod wybranym kątem.`}
                  </p>
                </section>
              )}

              {/* KROK 2 – PROFIL I ROZSTAW */}
              {step === 2 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 2 · Profil i rozstaw
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[12px] font-semibold text-primary mb-1">
                        Profil aluminiowy
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profiles.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() =>
                              setProfileId(
                                p.id as "60x40" | "80x40" | "80x80"
                              )
                            }
                            className={`px-3 py-1 rounded-full border text-[12px] ${
                              profileId === p.id
                                ? "bg-accent text-white border-accent"
                                : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      {fillType === "twist" && twistAngle && (
                        <p className="mt-1 text-[11px] text-neutral-500">
                          W wersji Twist profil {selectedProfile.label} jest
                          obrócony o ok. {twistAngle}°.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-[12px] font-semibold text-primary mb-1">
                        Rozstaw profili
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableSpacingOptions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() =>
                              setSpacingId(s.id as "4" | "6" | "9")
                            }
                            className={`px-3 py-1 rounded-full border text-[12px] ${
                              spacingId === s.id
                                ? "bg-accent text-white border-accent"
                                : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Standardowo przyjmujemy rozstaw ok. 6&nbsp;cm. Inne
                        wartości traktujemy jako wariant na zamówienie.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* KROK 3 – WYMIARY */}
              {step === 3 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 3 · Wymiary furtki
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
                          Szerokość światła przejścia
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
                          min={120}
                          max={200}
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
                          Przykładowy zakres: 120–200 cm. Finalne wymiary
                          potwierdzimy na etapie projektu.
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-primary mb-1">
                          Szerokość światła (cm)
                        </p>
                        <input
                          type="number"
                          min={90}
                          max={150}
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
                          Standardowa furtka ma ok. 100 cm światła, ale możemy
                          przygotować inne wymiary.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* KROK 4 – KOLOR + STRUKTURA */}
              {step === 4 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 4 · Kolor RAL i struktura
                  </p>

                  {/* Kolory standardowe */}
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
                        od wybranego odcienia i struktury.
                      </p>

                      {/* Przycisk do pełnej palety RAL */}
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

                  {/* Struktura powłoki */}
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
                      Furtki malujemy proszkowo w strukturze mat lub drobny
                      brokat – obie powłoki są trwałe i odporne na warunki
                      atmosferyczne.
                    </p>
                  </div>
                </section>
              )}

              {/* KROK 5 – ILOŚĆ + PODSUMOWANIE + DODATKI */}
              {step === 5 && (
                <section className="space-y-5 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 5 · Ilość i podsumowanie
                  </p>

                  <div className="flex items-center gap-3">
                    <p className="text-[12px] font-semibold text-primary">
                      Ilość sztuk
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
                    <div className="text-[13px] text-neutral-700">
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
                        Uwzględniamy profil, rozstaw, wariant Prosty/Twist,
                        kolor RAL oraz wykończenie powłoki. Cena ma charakter
                        orientacyjny.
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

                  {/* DODATKI W TEJ SAMEJ SERII – UPSELL */}
                  <div className="mt-2 space-y-3 rounded-2xl bg-neutral-50/80 border border-border/70 p-3 md:p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Do kompletu w serii Stand Up
                    </p>
                    <p className="text-[12px] text-neutral-700">
                      Najczęściej z furtką Stand Up zamawiane są także: brama
                      przesuwna, zadaszenie wejścia, słupek multimedialny oraz
                      automatyka. Możesz przejść do ich konfiguratorów jednym
                      kliknięciem.
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                      {upsellItems.map((item) => (
                        <article
                          key={item.id}
                          className="flex gap-3 rounded-2xl bg-white/90 border border-border/70 p-3"
                        >
                          {item.image && (
                            <div className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover object-center"
                              />
                              {item.badge && (
                                <span className="absolute left-1 bottom-1 rounded-full bg-white/85 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-primary">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex-1 flex flex-col gap-1">
                            <h3 className="text-[13px] font-semibold text-primary">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-neutral-700">
                              {item.description}
                            </p>
                            <div className="mt-1">
                              <Link
                                href={item.href}
                                className="inline-flex items-center justify-center rounded-2xl border border-accent text-accent text-[10px] font-semibold uppercase tracking-[0.18em] px-3 py-1 hover:bg-accent hover:text-white transition-colors"
                              >
                                Otwórz konfigurator
                              </Link>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
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
                    Dodaj konfigurację do koszyka
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* BLOKI OPISOWE – PO UŁOŻENIU KONFIGURATORA */}
          <section className="space-y-3">
            <h2 className="text-[20px] md:text-[30px] font-extrabold text-accent uppercase text-center">
              Jak działa system Stand Up przy furtce?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800 text-center">
              Furtka Stand Up wykorzystuje pionowy układ profili aluminiowych,
              dzięki czemu bez problemu łączy się z przęsłami, bramą przesuwną
              i dwuskrzydłową z tej sameej kolekcji. Wersja prosta podkreśla
              pionowy rytm i minimalizm, natomiast Twist – poprzez obrót
              lameli – daje efekt lekkiej żaluzji i większej prywatności. Cała
              konstrukcja jest spawana, szlifowana i malowana proszkowo, co
              przekłada się na trwałość oraz brak konieczności regularnego
              odnawiania powłoki.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[5px] md:text-[10px] font-bold text-accent text-center">
              Rysunek techniczny furtki Stand Up
            </h2>

            <div className="relative mx-auto w-full max-w-5xl aspect-[77/54] rounded-3xl overflow-hidden shadow-soft bg-white/70">
              <Image
                src="/products/standup-furtka-tech.png"
                alt="Rysunek techniczny furtki Stand Up"
                fill
                className="object-contain object-center"
              />
            </div>
          </section>

          <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
            <div className="space-y-3">
              <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
                Montaż i integracja z pozostałymi elementami ogrodzenia
              </h2>
              <p className="text-[14px] md:text-[15px] text-neutral-800">
                Furtkę Stand Up można zestawić z przęsłami, bramą, zadaszeniem
                nad wejściem oraz słupkiem multimedialnym – tworząc spójny
                front posesji. Konstrukcja przygotowana jest do montażu
                elektrozaczepu oraz systemów kontroli dostępu. Fabryczne
                dopasowanie wymiarów skrzydła do przęseł skraca czas pracy
                ekipy montażowej i ułatwia estetyczne prowadzenie instalacji.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-transparent">
              <Image
                src="/products/standup-furtka-prosta-detail-1.jpg"
                alt="Detal furtki aluminiowej Stand Up"
                fill
                className="object-cover object-center"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
              Dla kogo jest furtka Stand Up?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800">
              Ten model dobrze sprawdzi się przy nowoczesnych domach
              jednorodzinnych, inwestycjach premium oraz budynkach usługowych.
              Elastyczna konfiguracja profili, rozstawu, wysokości i koloru
              RAL pozwala dopasować ogrodzenie do projektu architekta, a wersja
              Twist podnosi poziom prywatności bez rezygnacji z lekkiej,
              pionowej formy. Konfigurator online porządkuje dane potrzebne do
              przygotowania wiążącej wyceny i dokumentacji wykonawczej.
            </p>
          </section>
        </div>
      </section>

      {/* SLIDERY HERO NA CAŁĄ SZEROKOŚĆ */}
      <section className="mt-8 border-t border-border">
        <HeroSlider />
      </section>

      {/* PRZYDATNE LINKI */}
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
                Przybliżona prezentacja kolorów RAL – pomocna przy wyborze
                odcienia furtki i bramy.
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
                Pełna specyfikacja ogrodzeń pionowych, Slab Fence, Royal oraz
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
                Szczegóły gwarancji na konstrukcje aluminiowe i stalowe NAGET.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
