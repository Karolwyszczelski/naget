// app/stand-up/zadaszenie/page.tsx 
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FaBorderAll,
  FaSlidersH,
  FaPalette,
  FaStickyNote,
  FaClipboardCheck,
  FaChevronRight,
} from "react-icons/fa";

import { useCart } from "../../../CartContext";
import HeroSlider from "../../../components/HeroSlider";
import ZadaszenieModel from "../../../components/zadaszenie-standupmodel";


/**
 * KONFIG – WSPÓLNY Z SERIĄ STAND UP
 * ----------------------------------------------------
 */

const basePrice = 4200; // orientacyjna baza dla zadaszenia

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

const spacingOptionsByProfile: Record<string, string[]> = {
  "60x40": ["4", "6", "9"],
  "80x40": ["4", "6", "9"],
  "80x80": ["6"], // dla 80×80 tylko 6 cm
};

const twistAnglesByProfile: Record<string, number> = {
  "60x40": 45,
  "80x40": 45,
  "80x80": 15,
};

// bazowa paleta RAL
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

type ColorMode = "standard" | "custom";

// UPSSELL – jak przy bramach/furtce
const upsellItems = [
  {
    id: "upsell-furtka",
    name: "Furtka Stand Up",
    description:
      "Furtka w tym samym rytmie profili i kolorze, co zadaszenie – spójna oś wejścia.",
    href: "/stand-up/furtka",
    image: "/products/standup-furtka-prosta-main.jpg",
    badge: "Furtka",
  },
  {
    id: "upsell-brama-przesuwna",
    name: "Brama przesuwna Stand Up",
    description:
      "Brama wjazdowa w serii Stand Up – dopasowana do furtki, zadaszenia i ogrodzenia.",
    href: "/stand-up/brama-przesuwna",
    image: "/products/standup-brama.png",
    badge: "Brama przesuwna",
  },
  {
    id: "upsell-slup-multimedialny",
    name: "Słupek multimedialny Stand Up",
    description:
      "Słupek pod wideodomofon, skrzynkę i automatykę – w tej samej linii co zadaszenie.",
    href: "/stand-up/slupek-multimedialny",
    image: "/products/standup-slup-multimedialny.jpg", // podmień, jeśli masz inną nazwę pliku
    badge: "Słupek multimedialny",
  },
  {
    id: "upsell-brama",
    name: "Brama Przesuwna Stand Up",
    description:
      "Brama w tym samym rytmie profili co furtka – skonfiguruj w tej samej serii.",
    href: "/stand-up/brama-przesuwna",
    image: "/products/brama-stand-przesuwna.png",
    badge: "Brama Przesuwna",
  },
];

// ZDJĘCIA PROSTA / TWIST – podmień ścieżki na swoje finalne pliki
const variantImages: Record<"prosta" | "twist", string[]> = {
  prosta: [
    "/products/standup-zadaszenie-proste-main.jpg",
    "/products/standup-zadaszenie-proste-detail-1.webp",
    "/products/standup-zadaszenie-proste-detail-2.jpg",
  ],
  twist: [
    "/products/standup-zadaszenie-twist-main.jpg",
    "/products/standup-zadaszenie-twist-detail-1.jpg",
  ],
};

export default function StandUpZadaszeniePage() {
  const { addItem } = useCart();

  const [step, setStep] = useState<Step>(1);

  const steps: StepDef[] = [
    { id: 1, label: "Wypełnienie", icon: FaBorderAll },
    { id: 2, label: "Profil i rozstaw", icon: FaSlidersH },
    { id: 3, label: "Kolor i struktura", icon: FaPalette },
    { id: 4, label: "Montaż i uwagi", icon: FaStickyNote },
    { id: 5, label: "Podsumowanie", icon: FaClipboardCheck },
  ];

  const handleNextStep = () =>
    setStep((prev) => (prev < 5 ? ((prev + 1) as Step) : prev));

  const handlePrevStep = () =>
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  // WYPEŁNIENIE / PROFIL / ROZSTAW
  const [fillType, setFillType] = useState<"prosta" | "twist">("prosta");
  const [profileId, setProfileId] = useState<"60x40" | "80x40" | "80x80">(
    "60x40"
  );
  const [spacingId, setSpacingId] = useState<"2" | "4" | "6" | "9">("6");

  // KOLOR / STRUKTURA
  const [colorMode, setColorMode] = useState<ColorMode>("standard");
  const [colorId, setColorId] = useState<string>(baseColors[1].id); // domyślnie RAL 7016
  const [customRalCode, setCustomRalCode] = useState<string>("");
  const [finishId, setFinishId] = useState<FinishId>("mat");

  // MONTAŻ
  const [mountingSide, setMountingSide] = useState<
    "lewa" | "prawa" | "nie-wiem"
  >("nie-wiem");
  const [mountingNote, setMountingNote] = useState("");

  // ILOŚĆ
  const [quantity, setQuantity] = useState(1);

  // PODGLĄD: model 3D / zdjęcia
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);

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

  // po zmianie PROSTA/TWIST reset na model 3D
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

  const previewColorHex =
    colorMode === "standard" ? selectedBaseColor.hex : "#383E4A";
  const twistAngle = twistAnglesByProfile[selectedProfile.id];

  const thumbs = variantImages[fillType];
  const activeImageAlt =
    fillType === "prosta"
      ? "Zadaszenie nad furtkę Stand Up – wersja prosta"
      : "Zadaszenie nad furtkę Stand Up Twist – wizualizacja";

  // CENA
  const { unitPrice, priceLabel, totalLabel } = useMemo(() => {
    let factor = 1.0;
    factor *= selectedProfile.factor;
    factor *= selectedSpacing.factor;
    factor *= selectedFinish.factor;

    if (fillType === "twist") {
      factor *= 1.04;
    }
    if (colorMode === "custom") {
      factor *= 1.06;
    }

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
    selectedProfile.factor,
    selectedSpacing.factor,
    selectedFinish.factor,
    fillType,
    colorMode,
    quantity,
  ]);

  // DODANIE DO KOSZYKA
  const handleAddToCart = () => {
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
      productId: "standup-zadaszenie",
      name: "Zadaszenie nad furtkę Stand Up",
      series: "stand-up",
      unitPrice,
      quantity: Math.max(quantity, 1),
      config: {
        // stałe wymiary katalogowe
        widthCm: 120,
        depthCm: 100,
        heightCm: 240,
        // seria / wypełnienie
        fillType,
        profileId: selectedProfile.id,
        profileLabel: selectedProfile.label,
        spacingCm,
        // kolor / struktura
        colorId: colorIdForCart,
        colorName,
        colorMode: colorMode === "standard" ? "standard" : "custom-ral",
        customRalCode:
          colorMode === "custom" && customRalCode ? customRalCode : undefined,
        finishId: selectedFinish.id,
        finishLabel: selectedFinish.label,
        // wyposażenie
        hasLed: true,
        hasMotionSensor: true,
        glazingType: "szkło bezpieczne mleczne",
        // montaż
        mountingSide,
        mountingNote: mountingNote || undefined,
        // ogólne
        material: "aluminium + szkło bezpieczne",
      },
    });
  };

  return (
    <>
      {/* GŁÓWNA SEKCJA PRODUKTU */}
      <section className="section">
        <div className="container space-y-10">
          {/* INTRO */}
          <header className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
              Seria Stand Up – zadaszenie wejścia
            </p>
            <h1 className="text-[26px] md:text-[40px] font-extrabold text-accent uppercase">
              Zadaszenie nad furtkę Stand Up – szkło mleczne + LED z czujnikiem
              ruchu
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
              Zadaszenie wejścia dopasowane do pionowego rytmu ogrodzenia Stand
              Up. Stałe wymiary katalogowe:{" "}
              <strong>120×100 cm, wysokość słupów 240 cm</strong>. W zestawie
              szkło bezpieczne mleczne oraz lampa LED z czujnikiem ruchu. W
              konfiguratorze dopasujesz wypełnienie Stand Up Prosty / Twist,
              profil, rozstaw oraz kolor RAL tak, aby całość tworzyła jednolity
              front posesji.
            </p>
          </header>

          {/* 2 KOLUMNY – MODEL + KONFIGURATOR */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,3fr)] items-start">
            {/* LEWO – MODEL 3D / ZDJĘCIA */}
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
                  <ZadaszenieModel
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
                          ? `Zadaszenie Stand Up Prosty – widok / detal ${
                              idx + 1
                            }`
                          : `Zadaszenie Stand Up Twist – widok / detal ${
                              idx + 1
                            }`
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

              <p className="text-[11px] text-neutral-600">
                Podgląd prezentuje zadaszenie dla szerokości{" "}
                <strong>120 cm</strong> i głębokości <strong>100 cm</strong>.
                Wysokość słupów wynosi <strong>240 cm</strong>, co sprawdza się
                przy standardowych wysokościach ogrodzenia. Tylne wypełnienie
                jest z tych samych profili co furtka i przęsła.
              </p>
            </div>

            {/* PRAWO – KONFIGURATOR */}
            <div className="rounded-3xl border border-border bg-white/80 p-5 md:p-6 space-y-6 shadow-soft">
              <h2 className="text-[18px] md:text-[20px] font-bold text-primary mb-1">
                Konfigurator zadaszenia Stand Up
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

              {/* KROK 1 – WYPEŁNIENIE */}
              {step === 1 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 1 · Wypełnienie tylne Stand Up
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
                      ? "pionowe profile ustawione równolegle za furtką – powtarzają rytm ogrodzenia i zasłaniają wejście."
                      : `profile są obrócone o ok. ${
                          twistAngle ?? 45
                        }° względem osi – przestrzeń za zadaszeniem widać tylko pod wybranym kątem, co zwiększa prywatność wejścia.`}
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
                        Standardowo przyjmujemy rozstaw ok. 6&nbsp;cm. Gęstszy
                        lub rzadszy rozstaw traktujemy jako wariant na
                        zamówienie.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* KROK 3 – KOLOR I STRUKTURA */}
              {step === 3 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 3 · Kolor RAL i struktura
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
                      Konstrukcję malujemy proszkowo w strukturze mat lub
                      drobny brokat – dopasuj powłokę do reszty ogrodzenia.
                    </p>
                  </div>
                </section>
              )}

              {/* KROK 4 – MONTAŻ I UWAGI */}
              {step === 4 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 4 · Montaż i uwagi do projektu
                  </p>

                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      Preferowana strona doprowadzenia zasilania / montażu
                    </p>
                    <div className="flex flex-wrap gap-2 text-[12px]">
                      <button
                        type="button"
                        onClick={() => setMountingSide("lewa")}
                        className={`px-3 py-1 rounded-full border ${
                          mountingSide === "lewa"
                            ? "bg-accent text-white border-accent"
                            : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                        }`}
                      >
                        Od strony lewego słupa
                      </button>
                      <button
                        type="button"
                        onClick={() => setMountingSide("prawa")}
                        className={`px-3 py-1 rounded-full border ${
                          mountingSide === "prawa"
                            ? "bg-accent text-white border-accent"
                            : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                        }`}
                      >
                        Od strony prawego słupa
                      </button>
                      <button
                        type="button"
                        onClick={() => setMountingSide("nie-wiem")}
                        className={`px-3 py-1 rounded-full border ${
                          mountingSide === "nie-wiem"
                            ? "bg-accent text-white border-accent"
                            : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                        }`}
                      >
                        Do ustalenia z projektantem
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[12px] font-semibold text-primary">
                      Dodatkowe uwagi montażowe (opcjonalnie)
                    </p>
                    <textarea
                      rows={3}
                      value={mountingNote}
                      onChange={(e) => setMountingNote(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Np. montaż do ściany budynku, podłączenie pod istniejący obwód oświetleniowy, niestandardowa wysokość posadzki..."
                    />
                    <p className="text-[11px] text-neutral-500">
                      Te informacje trafią do projektanta – na ich podstawie
                      przygotujemy szczegółową dokumentację i wycenę montażu.
                    </p>
                  </div>
                </section>
              )}

              {/* KROK 5 – ILOŚĆ + PODSUMOWANIE + UPSELL */}
              {step === 5 && (
                <section className="space-y-5 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 5 · Ilość i podsumowanie
                  </p>

                  <div className="flex items-center gap-3">
                    <p className="text-[12px] font-semibold text-primary">
                      Ilość zadaszeń
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
                      <ul className="mt-2 text-[11px] text-neutral-600 list-disc list-inside space-y-0.5">
                        <li>szkło bezpieczne mleczne</li>
                        <li>lampa LED z czujnikiem ruchu</li>
                        <li>
                          słupy 100×100×2 mm, wys. ok. 240 cm (do docięcia na
                          budowie)
                        </li>
                      </ul>
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

                  {/* UPSELL KARTY – jak przy bramach/furtce */}
                  <div className="mt-2 space-y-3 rounded-2xl bg-neutral-50/80 border border-border/70 p-3 md:p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Najczęściej zamawiane z zadaszeniem Stand Up
                    </p>
                    <p className="text-[12px] text-neutral-700">
                      Zadaszenie zwykle zamawiane jest razem z furtką, bramą
                      wjazdową oraz słupkiem multimedialnym. Poniżej możesz
                      przejść bezpośrednio do ich konfiguratorów.
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
                    Dodaj zadaszenie do koszyka
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* BLOKI OPISOWE */}
          <section className="space-y-3">
            <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase text-center">
              Jak działa zadaszenie Stand Up?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800 text-center max-w-4xl mx-auto">
              Konstrukcja oparta na dwóch słupach 100×100×2 mm oraz ramie
              dachowej pozwala spiąć furtkę, słupek multimedialny i ogrodzenie w
              jedną kompozycję. Tylne wypełnienie z profili Stand Up maskuje
              wejście i instalacje, a tafla szkła bezpiecznego mlecznego
              zabezpiecza przed deszczem i śniegiem. Lampa LED z czujnikiem
              ruchu automatycznie doświetla strefę wejścia po zmroku.
            </p>
          </section>

          <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
            <div className="space-y-3">
              <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
                Montaż przy furtce i słupku multimedialnym
              </h2>
              <p className="text-[14px] md:text-[15px] text-neutral-800">
                Zadaszenie możesz mocować zarówno do słupków bramowych, jak i do
                dedykowanych słupów wolnostojących lub ściany budynku. Stałe
                wymiary katalogowe ułatwiają pracę ekipie montażowej, a
                konfigurator online porządkuje dane o kolorze, profilu, rozstawie
                oraz wymaganiach dotyczących zasilania lampy LED. Na bazie
                konfiguracji przygotujemy rysunki montażowe i wiążącą wycenę.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-neutral-100">
              <Image
                src="/products/standup-zadaszenie-proste-detail-1.webp"
                alt="Zadaszenie nad furtkę Stand Up – wizualizacja"
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
                Przybliżona prezentacja kolorów RAL – pomocna przy wyborze
                odcienia zadaszenia, furtki i bramy.
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
                Pełna specyfikacja ogrodzeń pionowych, zadaszeń oraz dodatków.
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
                Szczegóły gwarancji na konstrukcje aluminiowe i szkło
                zabezpieczające.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
