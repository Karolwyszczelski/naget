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
import DrewutniaModel from "../../../components/DrewutnieModel";

/**
 * KONFIGURATOR DREWUTNI – DODATKI
 * ----------------------------------------------------
 */

const basePrice = 3900; // orientacyjna cena bazowa drewutni

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

const standardSize = {
  widthCm: 200,
  depthCm: 65,
  heightCm: 200,
};

const frameMaterials = [
  {
    id: "steel",
    label: "Stal ocynkowana + RAL",
    factor: 1.0,
  },
  {
    id: "aluminium",
    label: "Aluminium + RAL",
    factor: 1.12,
  },
] as const;

const infillTypes = [
  {
    id: "palisada",
    label: "Drewutnia palisadowa – profil poziomy 80×20",
    description:
      "Poziome palisady 80×20 mm – lżejszy wizualnie wariant, drewno dobrze wysycha.",
    factor: 1.0,
  },
  {
    id: "standup",
    label: "Drewutnia STAND UP – profil pionowy 60×40",
    description:
      "Pionowe profile 60×40 mm – drewutnia w pionowym rytmie ogrodzenia Stand Up.",
    factor: 1.06,
  },
] as const;

type FinishOption = (typeof finishOptions)[number];
type FinishId = FinishOption["id"];

type FrameMaterialId = (typeof frameMaterials)[number]["id"];
type InfillId = (typeof infillTypes)[number]["id"];

type Variant = "standard" | "custom";
type ColorMode = "standard" | "custom";

type Step = 1 | 2 | 3 | 4;

type StepDef = {
  id: Step;
  label: string;
  icon: IconType;
};

export default function AddonsDrewutniePage() {
  const { addItem } = useCart();

  const [step, setStep] = useState<Step>(1);

  const steps: StepDef[] = [
    { id: 1, label: "Typ i wypełnienie", icon: FaBorderAll },
    { id: 2, label: "Wymiary", icon: FaRulerCombined },
    { id: 3, label: "Kolor i dach", icon: FaPalette },
    { id: 4, label: "Podsumowanie", icon: FaClipboardCheck },
  ];

  const handleNextStep = () =>
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  const handlePrevStep = () =>
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  // STEP 1 – typ i wypełnienie
  const [frameMaterialId, setFrameMaterialId] =
    useState<FrameMaterialId>("steel");
  const [infillId, setInfillId] = useState<InfillId>("palisada");
  const [hasBackWall, setHasBackWall] = useState<boolean>(true); // "bez pleców" = false

  // STEP 2 – wymiary
  const [variant, setVariant] = useState<Variant>("standard");
  const [customWidth, setCustomWidth] = useState<number | "">("");
  const [customDepth, setCustomDepth] = useState<number | "">("");
  const [customHeight, setCustomHeight] = useState<number | "">("");

  // STEP 3 – kolor / struktura / dach
  const [colorMode, setColorMode] = useState<ColorMode>("standard");
  const [colorId, setColorId] = useState<string>(baseColors[1].id);
  const [customRalCode, setCustomRalCode] = useState<string>("");
  const [finishId, setFinishId] = useState<FinishId>("mat");
  const [roofSameColor, setRoofSameColor] = useState<boolean>(true);

  // MONTAŻ / ILOŚĆ
  const [mountingNote, setMountingNote] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const selectedBaseColor =
    baseColors.find((c) => c.id === colorId) ?? baseColors[1];
  const selectedFinish =
    finishOptions.find((f) => f.id === finishId) ?? finishOptions[0];
  const selectedFrameMaterial =
    frameMaterials.find((m) => m.id === frameMaterialId) ?? frameMaterials[0];
  const selectedInfill =
    infillTypes.find((t) => t.id === infillId) ?? infillTypes[0];

  const previewColorHex =
    colorMode === "standard" ? selectedBaseColor.hex : "#383E4A";

  // CENA
  const { unitPrice, priceLabel, totalLabel } = useMemo(() => {
    let factor = 1.0;

    factor *= selectedFrameMaterial.factor;
    factor *= selectedInfill.factor;
    factor *= selectedFinish.factor;

    if (!hasBackWall) {
      factor *= 0.9; // "bez pleców" – mniej materiału
    }

    if (colorMode === "custom") {
      factor *= 1.06;
    }

    if (!roofSameColor) {
      factor *= 1.02; // osobne malowanie dachu
    }

    // korekta za wymiary
    const width =
      variant === "standard"
        ? standardSize.widthCm
        : typeof customWidth === "number"
        ? customWidth
        : standardSize.widthCm;

    const height =
      variant === "standard"
        ? standardSize.heightCm
        : typeof customHeight === "number"
        ? customHeight
        : standardSize.heightCm;

    const depth =
      variant === "standard"
        ? standardSize.depthCm
        : typeof customDepth === "number"
        ? customDepth
        : standardSize.depthCm;

    const baseArea = (standardSize.widthCm * standardSize.heightCm) / 10000; // m² fasady frontowej
    const currentArea = (width * height) / 10000;

    const areaFactor = currentArea / baseArea;
    factor *= 0.4 + areaFactor * 0.6;

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
    selectedFrameMaterial.factor,
    selectedInfill.factor,
    selectedFinish.factor,
    hasBackWall,
    colorMode,
    roofSameColor,
    variant,
    customWidth,
    customHeight,
    customDepth,
    quantity,
  ]);

  // DODANIE DO KOSZYKA
  const handleAddToCart = () => {
    const widthCm =
      variant === "standard"
        ? standardSize.widthCm
        : typeof customWidth === "number"
        ? customWidth
        : undefined;
    const depthCm =
      variant === "standard"
        ? standardSize.depthCm
        : typeof customDepth === "number"
        ? customDepth
        : undefined;
    const heightCm =
      variant === "standard"
        ? standardSize.heightCm
        : typeof customHeight === "number"
        ? customHeight
        : undefined;

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
      productId: "addons-drewutnia",
      name: "Drewutnia na drewno opałowe",
      series: "addons",
      unitPrice,
      quantity: Math.max(quantity, 1),
      config: {
        variant,
        widthCm: widthCm ?? standardSize.widthCm,
        depthCm: depthCm ?? standardSize.depthCm,
        heightCm: heightCm ?? standardSize.heightCm,
        standardSize: "2000 × 650 × 2000 mm",
        frameMaterialId: selectedFrameMaterial.id,
        frameMaterialLabel: selectedFrameMaterial.label,
        infillId: selectedInfill.id,
        infillLabel: selectedInfill.label,
        hasBackWall,
        roofType: "blacha ocynkowana + RAL",
        roofSameColor,
        colorId: colorIdForCart,
        colorName,
        colorMode: colorMode === "standard" ? "standard" : "custom-ral",
        customRalCode:
          colorMode === "custom" && customRalCode ? customRalCode : undefined,
        finishId: selectedFinish.id,
        finishLabel: selectedFinish.label,
        mountingNote: mountingNote || undefined,
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
              Dodatki – drewutnia na drewno opałowe
            </p>
            <h1 className="text-[26px] md:text-[40px] font-extrabold text-accent uppercase">
              Drewutnia ogrodowa – palisadowa lub Stand Up
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
              Trwała, masywna i estetycznie wykonana drewutnia do składowania
              drewna opałowego. Z pewnością dopasuje się zarówno do
              tradycyjnych domów jednorodzinnych, jak również świetnie wpisze
              się w teren przy nowoczesnych budynkach – pensjonatach i
              hotelach. W standardzie{" "}
              <strong>
                szerokość 2000 mm, głębokość 650 mm, wysokość 2000 mm
              </strong>{" "}
              oraz zadaszenie z blachy ocynkowanej malowanej na RAL.
            </p>
          </header>

          {/* 2 KOLUMNY – PODGLĄD + KONFIGURATOR */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,3fr)] items-start">
            {/* PODGLĄD (3D) */}
            <div className="space-y-4">
              <DrewutniaModel colorHex={previewColorHex} infill={infillId} />
              <p className="text-[11px] text-neutral-600">
                Podgląd prezentuje drewutnię o wymiarach katalogowych{" "}
                <strong>200 × 65 × 200 cm</strong> z wybranym typem
                wypełnienia (palisada lub Stand Up) oraz kolorem konstrukcji
                zgodnym z konfiguracją po prawej.
              </p>
            </div>

            {/* KONFIGURATOR */}
            <div className="rounded-3xl border border-border bg-white/80 p-5 md:p-6 space-y-6 shadow-soft">
              <h2 className="text-[18px] md:text-[20px] font-bold text-primary mb-1">
                Konfigurator drewutni
              </h2>

              {/* KROKI */}
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

              {/* KROK 1 – TYP I WYPEŁNIENIE */}
              {step === 1 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 1 · Typ konstrukcji i wypełnienie
                  </p>

                  <div className="space-y-3">
                    <p className="text-[12px] font-semibold text-primary">
                      Materiał ramy
                    </p>
                    <div className="flex flex-wrap gap-2 text-[12px]">
                      {frameMaterials.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFrameMaterialId(m.id)}
                          className={`px-3 py-1 rounded-full border ${
                            frameMaterialId === m.id
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[12px] font-semibold text-primary">
                      Wypełnienie drewutni
                    </p>
                    <div className="space-y-2">
                      {infillTypes.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setInfillId(t.id)}
                          className={`w-full text-left rounded-2xl border px-3 py-2 text-[12px] ${
                            infillId === t.id
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          <span className="block font-semibold">
                            {t.label}
                          </span>
                          <span className="block text-[11px] opacity-80">
                            {t.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[12px] font-semibold text-primary">
                      Plecy drewutni
                    </p>
                    <label className="flex items-center gap-2 text-[12px]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={hasBackWall}
                        onChange={(e) => setHasBackWall(e.target.checked)}
                      />
                      <span>
                        Wersja z tylnym wypełnieniem (od strony ściany /
                        ogrodzenia)
                      </span>
                    </label>
                    <p className="text-[11px] text-neutral-500">
                      Odznacz, jeśli potrzebujesz{" "}
                      <strong>drewutni „bez pleców”</strong> – dostawianej
                      bezpośrednio do ściany budynku.
                    </p>
                  </div>
                </section>
              )}

              {/* KROK 2 – WYMIARY */}
              {step === 2 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 2 · Wymiary drewutni
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
                        Szerokość:{" "}
                        <strong>{standardSize.widthCm} cm</strong>
                      </p>
                      <p>
                        Głębokość:{" "}
                        <strong>{standardSize.depthCm} cm</strong>
                      </p>
                      <p>
                        Wysokość:{" "}
                        <strong>{standardSize.heightCm} cm</strong>
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Wymiary standardowe dobrze sprawdzają się przy
                        większości realizacji. Przy projektach indywidualnych
                        wybierz opcję „Na wymiar”.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3 text-[12px]">
                      <div>
                        <p className="font-semibold text-primary mb-1">
                          Szerokość (cm)
                        </p>
                        <input
                          type="number"
                          min={120}
                          max={400}
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
                          min={50}
                          max={120}
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
                      <div>
                        <p className="font-semibold text-primary mb-1">
                          Wysokość (cm)
                        </p>
                        <input
                          type="number"
                          min={160}
                          max={260}
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
                      <p className="md:col-span-3 text-[11px] text-neutral-500">
                        Dla wymiarów niestandardowych przygotujemy rysunki
                        techniczne oraz indywidualną wycenę fundamentu /
                        posadowienia.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* KROK 3 – KOLOR I DACH */}
              {step === 3 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 3 · Kolor ramy i dachu
                  </p>

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
                  </div>

                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      Zadaszenie – blacha ocynkowana + RAL
                    </p>
                    <label className="flex items-center gap-2 text-[12px]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={roofSameColor}
                        onChange={(e) => setRoofSameColor(e.target.checked)}
                      />
                      <span>
                        Dach w tym samym kolorze RAL co konstrukcja
                      </span>
                    </label>
                    <p className="text-[11px] text-neutral-500">
                      Przy odznaczeniu dach możemy pomalować na inny kolor
                      RAL (ustalimy go indywidualnie w projekcie).
                    </p>
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
                      placeholder="Np. dostawienie do ściany budynku, montaż na istniejącej kostce, niestandardowa wysokość podestu..."
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
                      Ilość drewutni
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
                        <li>rama z konstrukcji stalowej lub aluminiowej (profil 60×40 + RAL)</li>
                        <li>
                          wypełnienie: drewutnia palisadowa (profil poziomy 80×20) lub STAND UP (profil pionowy 60×40)
                        </li>
                        <li>zadaszenie z blachy ocynkowanej malowanej na RAL</li>
                        <li>wersja z plecami lub „bez pleców” do ściany budynku</li>
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

                  <div className="mt-2 space-y-3 rounded-2xl bg-neutral-50/80 border border-border/70 p-3 md:p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Jak wygląda dalszy proces?
                    </p>
                    <p className="text-[12px] text-neutral-700">
                      Po dodaniu drewutni do koszyka otrzymamy komplet danych:
                      typ konstrukcji, wypełnienie, wymiary, kolor oraz uwagi
                      montażowe. Na tej podstawie przygotujemy rysunki
                      techniczne oraz wiążącą wycenę, wraz z ewentualnym
                      transportem i montażem.
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
                    Dodaj drewutnię do koszyka
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OPISY POD KONFIGURATOREM */}
          <section className="space-y-3">
            <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase text-center">
              Dlaczego warto postawić drewutnię?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800 text-center max-w-4xl mx-auto">
              Odpowiednio zaprojektowana drewutnia pozwala przechowywać drewno
              w suchym i przewiewnym miejscu, dzięki czemu lepiej się sezonuje
              i czyściej spala w kominku lub piecu. Konstrukcja z profili
              stalowych lub aluminiowych z zadaszeniem z blachy ocynkowanej
              chroni przed deszczem i śniegiem, a ażurowe wypełnienie zapewnia
              cyrkulację powietrza.
            </p>
          </section>

          <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
            <div className="space-y-3">
              <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
                Dopasowanie do ogrodzenia i architektury
              </h2>
              <p className="text-[14px] md:text-[15px] text-neutral-800">
                Dzięki dwóm wariantom wypełnienia – palisadowemu i Stand Up –
                drewutnia może kontynuować rytm przęseł ogrodzeniowych lub
                stanowić osobny akcent w ogrodzie. Malowanie na kolor RAL
                pozwala dopasować konstrukcję do stolarki okiennej, dachu albo
                ogrodzenia, a opcja „bez pleców” ułatwia dosunięcie drewutni
                bezpośrednio do ściany budynku.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-neutral-100">
              <Image
                src="/products/addons-drewutnia-detail.jpg"
                alt="Drewutnia w ogrodzie – detal"
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
                Ułatwia dobór koloru konstrukcji drewutni do ogrodzenia,
                stolarki i dachu.
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
                Parametry techniczne ogrodzeń, dodatków i akcesoriów.
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
                Szczegóły gwarancji na konstrukcje stalowe i aluminiowe NAGET.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
