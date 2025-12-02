"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../../CartContext";
import HeroSlider from "../../../components/HeroSlider";
import BramaPrzesuwnaModel from "../../../components/BramaPrzesuwnaModel";
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

// orientacyjna cena bazowa bramy przesuwnej
const basePrice = 11000;

// standardowe wysokości / szerokości (światło bramy w mm)
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

// profile wypełnienia – jak w furtce
const profiles = [
  { id: "60x40", label: "Profil 60×40 mm", factor: 1.0 },
  { id: "80x40", label: "Profil 80×40 mm", factor: 1.07 },
  { id: "80x80", label: "Profil 80×80 mm", factor: 1.15 },
];

// rozstaw (w przybliżeniu cm)
const spacingOptionsBase = [
  { id: "2", label: "ok. 2 cm – maksymalna prywatność", factor: 1.15 },
  { id: "4", label: "ok. 4 cm – więcej prywatności", factor: 1.08 },
  { id: "6", label: "ok. 6 cm – standard", factor: 1.0 },
  { id: "9", label: "ok. 9 cm – bardziej ażurowe", factor: 0.95 },
];

// które rozstawy są dozwolone dla danego profilu
const spacingOptionsByProfile: Record<string, string[]> = {
  "60x40": ["4", "6", "9"],
  "80x40": ["4", "6", "9"],
  "80x80": ["6"], // dla 80×80 tylko 6 cm
};

// kąty obrotu TWIST
const twistAnglesByProfile: Record<string, number> = {
  "60x40": 45,
  "80x40": 45,
  "80x80": 15,
};

// kolory bazowe RAL
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

// zdjęcia dla PROSTEJ i TWIST – podmień ścieżki na swoje, gdy będziesz mieć finalne pliki
const variantImages: Record<"prosta" | "twist", string[]> = {
  prosta: [
    "/products/brama-stand-przesuwna.jpeg", // główny widok
    "/products/standup-bramaprzes-detail-1.webp",
    "/products/standup-bramaprzes-detail-2.webp",
  ],
  twist: [
    "/products/brama-stand-przesuwna-twist.jpeg", // jeśli nie masz, może na razie wskazywać na ten sam plik co prosta
    "/products/standup-bramaprzes-twist-detail-1.webp",
    "/products/standup-bramaprzes-twist-detail-2.webp",
  ],
};

const upsellItems = [
  {
    id: "upsell-furtka",
    name: "Furtka Stand Up",
    description:
      "Furtka w tym samym rytmie profili co brama – spójny front posesji.",
    href: "/stand-up/furtka",
    image: "/products/furtka-stand.png",
    badge: "Furtka",
  },
  {
    id: "upsell-brama",
    name: "Brama Dwuskrzydłowa Stand Up",
    description:
      "Brama w tym samym rytmie profili co furtka – skonfiguruj w tej samej serii.",
    href: "/stand-up/brama-dwuskrzydlowa",
    image: "/products/standup-brama-dwuskrzydlowa1.png",
    badge: "Brama dwuskrzydłowa",
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

export default function StandUpBramaPrzesuwnaPage() {
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
  const [heightId, setHeightId] = useState(standardHeights[1].id); // 150
  const [widthId, setWidthId] = useState(standardWidths[1].id); // 500

  // na wymiar
  const [customHeight, setCustomHeight] = useState<number | "">("");
  const [customWidth, setCustomWidth] = useState<number | "">("");

  // wypełnienie
  const [fillType, setFillType] = useState<"prosta" | "twist">("prosta");
  const [profileId, setProfileId] = useState<"60x40" | "80x40" | "80x80">(
    "60x40"
  );
  const [spacingId, setSpacingId] = useState<"2" | "4" | "6" | "9">("6");

  // kolor RAL + struktura
  const [colorMode, setColorMode] = useState<"standard" | "custom">(
    "standard"
  );
  const [colorId, setColorId] = useState<string>(baseColors[1].id); // antracyt
  const [customRalCode, setCustomRalCode] = useState<string>("");
  const [finishId, setFinishId] = useState<FinishId>("mat");

  // ilość
  const [quantity, setQuantity] = useState(1);

  // aktywny widok w galerii (null = model 3D, string = ścieżka zdjęcia)
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);

  const selectedHeight =
    standardHeights.find((h) => h.id === heightId) ?? standardHeights[1];
  const selectedWidth =
    standardWidths.find((w) => w.id === widthId) ?? standardWidths[1];
  const selectedProfile =
    profiles.find((p) => p.id === profileId) ?? profiles[0];

  const availableSpacingOptions = useMemo(() => {
  // TWIST – osobna logika:
  // 60×40 → tylko 2 cm
  // 80×40 → tylko 2 cm
  // 80×80 → tylko 6 cm
  if (fillType === "twist") {
    if (selectedProfile.id === "60x40" || selectedProfile.id === "80x40") {
      return spacingOptionsBase.filter((s) => s.id === "2");
    }
    if (selectedProfile.id === "80x80") {
      return spacingOptionsBase.filter((s) => s.id === "6");
    }
  }

  // PROSTA – wg spacingOptionsByProfile (dla 80×80 już tylko 6 cm)
  const allowed =
    spacingOptionsByProfile[selectedProfile.id] ??
    spacingOptionsBase.map((s) => s.id);

  return spacingOptionsBase.filter((s) => allowed.includes(s.id));
}, [selectedProfile.id, fillType]);

  useEffect(() => {
  const allowedIds = availableSpacingOptions.map((s) => s.id);
  if (!allowedIds.includes(spacingId)) {
    setSpacingId(allowedIds[0] as "2" | "4" | "6" | "9");
  }
}, [availableSpacingOptions, spacingId]);

  // reset widoku na model 3D po zmianie PROSTA/TWIST
  useEffect(() => {
    setActiveImageSrc(null);
  }, [fillType]);

  const selectedSpacing =
    availableSpacingOptions.find((s) => s.id === spacingId) ??
    availableSpacingOptions[0];

  const selectedBaseColor =
    baseColors.find((c) => c.id === colorId) ?? baseColors[1];

  const selectedFinish =
    finishOptions.find((f) => f.id === finishId) ?? finishOptions[0];

  // kolor do podglądu (3D)
  const previewColorHex =
    colorMode === "standard" ? selectedBaseColor.hex : "#383E4A";

  // KALKULACJA CENY – podobnie jak w furtce, ale mocniej reaguje na szerokość
  const { unitPrice, priceLabel, totalLabel } = useMemo(() => {
    let factor = 1.0;

    factor *= selectedProfile.factor;
    factor *= selectedSpacing.factor;
    factor *= selectedFinish.factor;

    // wpływ wymiarów
    if (variant === "standard") {
      const h = Number(selectedHeight.id); // cm
      const w = Number(selectedWidth.id); // cm
      const areaFactor =
        (h / 150) * 0.5 + (w / 500) * 0.6; // brama mocniej zależy od szerokości
      factor *= 1 + areaFactor * 0.12;
    } else {
      const h = typeof customHeight === "number" ? customHeight : 0;
      const w = typeof customWidth === "number" ? customWidth : 0;
      if (h && w) {
        const areaFactor =
          (h / 150) * 0.5 + (w / 500) * 0.6;
        factor *= 1 + areaFactor * 0.14;
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
        ? Number(selectedWidth.id) * 10 // 400 -> 4000 mm
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
      productId: "standup-brama",
      name: "Brama przesuwna Stand Up",
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
        material: "stal / aluminium",
        fillType,
        profileId: selectedProfile.id,
        profileLabel: selectedProfile.label,
        spacingCm,
        finishId: selectedFinish.id,
        finishLabel: selectedFinish.label,
      },
    });
  };

  const twistAngle = twistAnglesByProfile[profileId];

  const thumbs = variantImages[fillType].slice(1);
  const activeImageAlt =
    fillType === "prosta"
      ? "Brama przesuwna Stand Up – widok prosty"
      : "Brama przesuwna Stand Up Twist – widok";

  return (
    <>
      {/* SEKCJA GŁÓWNA PRODUKTU */}
      <section className="section">
        <div className="container space-y-10">
          {/* META / INTRO */}
          <header className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
              Seria Stand Up – brama przesuwna
            </p>
            <h1 className="text-[26px] md:text-[40px] font-extrabold text-accent uppercase">
              Brama przesuwna Stand Up – prosta i Twist
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
              Brama przesuwna z pionowych profili dopasowana do ogrodzenia
              Stand Up. Dostępna w wersji prostej i TWIST, w standardowych
              szerokościach 4000 / 5000 / 6000 mm oraz na wymiar. W komplecie
              słupy, wózki, rolki i najazd – gotowa do montażu z automatyką.
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
                  <BramaPrzesuwnaModel
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
                          ? `Detal bramy przesuwnej Stand Up prostej ${idx + 1}`
                          : `Detal bramy przesuwnej Stand Up Twist ${idx + 1}`
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

              <div className="rounded-3xl bg-white/80 border border-border p-4 text-[12px] text-neutral-700 space-y-1">
                <p>
                  W standardzie:{" "}
                  <strong>
                    2 słupy 80×80×2 mm, wózki jezdne, najazd, rolki prowadzące
                  </strong>
                  . Konstrukcja przygotowana pod montaż automatyki.
                </p>
                <p className="text-[11px] text-neutral-500">
                  Podgląd ma charakter poglądowy – kluczowe są parametry
                  z konfiguratora oraz dokumentacja techniczna.
                </p>
              </div>
            </div>

            {/* PRAWA – WIZARD KROK-PO-KROKU */}
            <div className="rounded-3xl border border-border bg-white/80 p-5 md:p-6 space-y-6 shadow-soft">
              <h2 className="text-[18px] md:text-[20px] font-bold text-primary mb-1">
                Konfigurator bramy przesuwnej Stand Up
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
                    Krok 1 · Wypełnienie bramy
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
                      ? "pionowe profile ustawione równolegle – maksymalny minimalizm i czytelny rytm na całej długości bramy."
                      : `lamelki są obrócone pod kątem ${
                          twistAngle ?? 45
                        }° względem osi profilu, co zwiększa prywatność przy zachowaniu lekkiej, pionowej formy.`}
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
                        Standardowo przyjmujemy rozstaw ok. 6&nbsp;cm.
                        Gęstsze i rzadsze rozstawy traktujemy jako warianty
                        projektowe.
                      </p>
                    </div>
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
                          Szerokość światła bramy
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
                          Typowy zakres: 130–200 cm. Finalne wymiary
                          doprecyzujemy na etapie projektu.
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-primary mb-1">
                          Szerokość światła bramy (cm)
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
                          Standardowo oferujemy 4000 / 5000 / 6000 mm światła,
                          ale możemy przygotować inne szerokości.
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
                        od odcienia i struktury.
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
                      Bramy malujemy proszkowo w strukturze mat lub drobny
                      brokat – trwała powłoka odporna na warunki atmosferyczne.
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
                        kolor RAL, strukturę oraz wymiar bramy. Cena ma
                        charakter orientacyjny – wiążącą wycenę prześlemy po
                        weryfikacji projektu.
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

                  {/* DODATKI / UZUPLENIENIA */}
                  <div className="mt-2 space-y-3 rounded-2xl bg-neutral-50/80 border border-border/70 p-3 md:p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Najczęściej zamawiane z bramą Stand Up
                    </p>
                    <p className="text-[12px] text-neutral-700">
                      Do bramy przesuwnej zwykle dobierana jest furtka w tym
                      samym wzorze, zadaszenie wejścia oraz komplet automatyki.
                      Możesz przejść do ich konfiguratorów jednym kliknięciem.
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
                    Dodaj konfigurację bramy do koszyka
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OPISY POD KONFIGURATOREM */}
          <section className="space-y-3">
            <h2 className="text-[20px] md:text-[30px] font-extrabold text-accent uppercase text-center">
              Jak działa system Stand Up przy bramie przesuwnej?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800 text-center">
              Brama Stand Up wykorzystuje pionowy układ profili dopasowany do
              furtki i przęseł z tej samej kolekcji. Wersja prosta podkreśla
              rytm ogrodzenia, a Twist – dzięki obrotowi lameli – podnosi
              poziom prywatności. Konstrukcja jest spawana, szlifowana i
              malowana proszkowo, co zapewnia wieloletnią trwałość bez
              konieczności odnawiania powłoki.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[5px] md:text-[10px] font-bold text-accent text-center">
              Rysunek techniczny Stand Up
            </h2>

            <div className="relative mx-auto w-full max-w-5xl aspect-[77/54] rounded-3xl overflow-hidden shadow-soft bg-white/70">
              <Image
                src="/products/standup-furtka-tech.png"
                alt="Rysunek techniczny bramy przesuwnej Stand Up"
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
                Brama przesuwna Stand Up łączy się z furtką, przęsłami,
                zadaszeniem i słupkiem multimedialnym. Konstrukcja przygotowana
                jest pod montaż automatyki, fotokomórek i akcesoriów
                bezpieczeństwa. Spójne wymiary i profile ułatwiają pracę ekipie
                montażowej i pozwalają zachować estetyczny, jednolity front
                posesji.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-transparent">
              <Image
                src="/products/brama-stand-przesuwna1.jpeg"
                alt="Brama przesuwna aluminiowa Stand Up"
                fill
                className="object-cover object-center"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
              Dla kogo jest brama Stand Up?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800">
              Brama przesuwna Stand Up sprawdzi się przy nowoczesnych domach
              jednorodzinnych, rezydencjach oraz inwestycjach premium, gdzie
              liczy się spójność ogrodzenia, wygoda użytkowania i trwałość.
              Konfigurator online pozwala zebrać wszystkie parametry potrzebne
              do przygotowania wiążącej wyceny, doboru automatyki i
              dokumentacji wykonawczej.
            </p>
          </section>
        </div>
      </section>

      {/* SLIDER HERO NA CAŁĄ SZEROKOŚĆ */}
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
                odcienia bramy i furtki.
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
                Szczegóły gwarancji na konstrukcje bram i ogrodzeń NAGET.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
