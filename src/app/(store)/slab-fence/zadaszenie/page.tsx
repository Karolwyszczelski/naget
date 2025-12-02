"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FaBorderAll,
  FaPalette,
  FaStickyNote,
  FaClipboardCheck,
  FaChevronRight,
} from "react-icons/fa";

import { useCart } from "../../../CartContext";
import HeroSlider from "../../../components/HeroSlider";
import SlabZadaszenieModel from "../../../components/Slabzadaszeniemodel";

/**
 * KONFIG – ZADASZENIE SLAB FENCE
 * ----------------------------------------------------
 */

const basePrice = 12000; // orientacyjna baza dla zadaszenia SLAB FENCE

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

// bazowa paleta RAL – jak w Stand Up
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

type ColorMode = "standard" | "custom";

type Step = 1 | 2 | 3 | 4;

type StepDef = {
  id: Step;
  label: string;
  icon: IconType;
};

export default function SlabFenceZadaszeniePage() {
  const { addItem } = useCart();

  const [step, setStep] = useState<Step>(1);

  const steps: StepDef[] = [
    { id: 1, label: "Wzór płyty", icon: FaBorderAll },
    { id: 2, label: "Kolor stelaża", icon: FaPalette },
    { id: 3, label: "Montaż i uwagi", icon: FaStickyNote },
    { id: 4, label: "Podsumowanie", icon: FaClipboardCheck },
  ];

  const handleNextStep = () =>
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  const handlePrevStep = () =>
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  // PŁYTA HPL
  const [hplId, setHplId] = useState<string>(hplPatterns[1].id); // NM04 Sintered Alloy

  // KOLOR / STRUKTURA STELAŻA
  const [colorMode, setColorMode] = useState<ColorMode>("standard");
  const [colorId, setColorId] = useState<string>(baseColors[1].id); // RAL 7016
  const [customRalCode, setCustomRalCode] = useState<string>("");
  const [finishId, setFinishId] = useState<FinishId>("mat");

  // MONTAŻ
  const [mountingSide, setMountingSide] = useState<
    "lewa" | "prawa" | "nie-wiem"
  >("nie-wiem");
  const [mountingNote, setMountingNote] = useState("");

  // ILOŚĆ
  const [quantity, setQuantity] = useState(1);

  const selectedHpl =
    hplPatterns.find((p) => p.id === hplId) ?? hplPatterns[1];

  const selectedBaseColor =
    baseColors.find((c) => c.id === colorId) ?? baseColors[1];

  const selectedFinish =
    finishOptions.find((f) => f.id === finishId) ?? finishOptions[0];

  const previewColorHex =
    colorMode === "standard" ? selectedBaseColor.hex : "#383E4A";
  const previewPanelTexture = selectedHpl.texture;
  const previewPanelColorHex = selectedHpl.colorHex;

  // CENA
  const { unitPrice, priceLabel, totalLabel } = useMemo(() => {
    let factor = 1.0;

    factor *= selectedHpl.factor;
    factor *= selectedFinish.factor;

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
  }, [selectedHpl.factor, selectedFinish.factor, colorMode, quantity]);

  // DODANIE DO KOSZYKA
  const handleAddToCart = () => {
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
      productId: "slab-zadaszenie",
      name: "Zadaszenie SLAB FENCE",
      series: "slab-fence",
      unitPrice,
      quantity: Math.max(quantity, 1),
      config: {
        system: "Slab Fence",
        // stałe wymiary katalogowe – jak Stand Up
        widthCm: 120,
        depthCm: 100,
        heightCm: 240,
        panelType: "płyta fasadowa HPL",
        hplId: selectedHpl.id,
        hplLabel: selectedHpl.label,
        hplGroup: selectedHpl.group,
        // kolor / struktura
        colorId: colorIdForCart,
        colorName,
        colorMode: colorMode === "standard" ? "standard" : "custom-ral",
        customRalCode:
          colorMode === "custom" && customRalCode ? customRalCode : undefined,
        finishId: selectedFinish.id,
        finishLabel: selectedFinish.label,
        // montaż
        mountingSide,
        mountingNote: mountingNote || undefined,
        // ogólne
        material: "stal / aluminium + płyta HPL",
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
              Seria SLAB FENCE – zadaszenie wejścia
            </p>
            <h1 className="text-[26px] md:text-[40px] font-extrabold text-accent uppercase">
              Zadaszenie SLAB FENCE – wejście w jednej linii z ogrodzeniem
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
              Zadaszenie SLAB FENCE zostało zaprojektowane tak, aby
              kontynuować linię ogrodzenia z płyt HPL. Stałe wymiary
              katalogowe:{" "}
              <strong>120×100 cm, wysokość słupów ok. 240 cm</strong>. Płyta
              HPL tworzy estetyczny dach nad wejściem, a stelaż z profili
              stalowych wykańczamy w kolorach RAL dopasowanych do ogrodzenia,
              bramy i furtki.
            </p>
          </header>

          {/* 2 KOLUMNY – MODEL + KONFIGURATOR */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,3fr)] items-start">
            {/* LEWO – MODEL 3D */}
            <div className="space-y-4">
              <SlabZadaszenieModel
                colorHex={previewColorHex}
                finish={finishId}
                panelTextureUrl={previewPanelTexture}
              />

              <p className="text-[11px] text-neutral-600">
                Podgląd prezentuje zadaszenie o szerokości{" "}
                <strong>120 cm</strong>, głębokości <strong>100 cm</strong> i
                wysokości słupów ok. <strong>240 cm</strong>. Dach oraz
                ewentualne osłony boczne wykonujemy z płyt HPL w wybranym
                dekorze – tym samym, co ogrodzenie SLAB FENCE.
              </p>
            </div>

            {/* PRAWO – KONFIGURATOR */}
            <div className="rounded-3xl border border-border bg-white/80 p-5 md:p-6 space-y-6 shadow-soft">
              <h2 className="text-[18px] md:text-[20px] font-bold text-primary mb-1">
                Konfigurator zadaszenia SLAB FENCE
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

              {/* KROK 1 – WZÓR PŁYTY */}
              {step === 1 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 1 · Wzór płyty HPL
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
                    Wybierz ten sam dekor, który zastosujesz na przęsłach,
                    furtce i bramie SLAB FENCE – dzięki temu zadaszenie
                    wtopi się w linię ogrodzenia.
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

              {/* KROK 2 – KOLOR I STRUKTURA STELAŻA */}
              {step === 2 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 2 · Kolor stelaża i struktura
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
                      Stelaż zadaszenia malujemy proszkowo w strukturze mat lub
                      drobny brokat – tak jak słupy i ramy ogrodzenia SLAB
                      FENCE.
                    </p>
                  </div>
                </section>
              )}

              {/* KROK 3 – MONTAŻ I UWAGI */}
              {step === 3 && (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 3 · Montaż i uwagi do projektu
                  </p>

                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      Preferowany sposób doprowadzenia zasilania / montażu
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
                      placeholder="Np. montaż między słupami ogrodzenia, dosunięcie do ściany budynku, przygotowanie pod instalację oświetlenia..."
                    />
                    <p className="text-[11px] text-neutral-500">
                      Te informacje trafią do projektanta – na ich podstawie
                      przygotujemy szczegółową dokumentację i wycenę montażu.
                    </p>
                  </div>
                </section>
              )}

              {/* KROK 4 – ILOŚĆ + PODSUMOWANIE */}
              {step === 4 && (
                <section className="space-y-5 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 4 · Ilość i podsumowanie
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
                        <li>stelaż stalowy ocynkowany malowany proszkowo</li>
                        <li>płyta HPL w wybranym dekorze Trespa</li>
                        <li>stałe wymiary katalogowe 120×100 cm, wys. słupów ok. 240 cm</li>
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
                      Do kompletu w serii SLAB FENCE
                    </p>
                    <p className="text-[12px] text-neutral-700">
                      Zadaszenie najczęściej zestawiamy z furtką oraz bramą
                      przesuwną lub dwuskrzydłową SLAB FENCE w tym samym
                      dekorze HPL. Po dodaniu zadaszenia do koszyka możesz
                      przejść do konfiguratorów pozostałych elementów.
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
                    Dodaj zadaszenie do koszyka
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* BLOKI OPISOWE */}
          <section className="space-y-3">
            <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase text-center">
              Jak działa zadaszenie SLAB FENCE?
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800 text-center max-w-4xl mx-auto">
              Zadaszenie SLAB FENCE spina linię ogrodzenia z bramą i furtką,
              tworząc jednolity, monolityczny front. Płyta HPL zastosowana na
              dachu oraz opcjonalnych osłonach bocznych kontynuuje dekor
              paneli ogrodzeniowych, a stalowy stelaż malowany proszkowo
              zapewnia sztywność i odporność na warunki atmosferyczne.
            </p>
          </section>

          <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
            <div className="space-y-3">
              <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
                Montaż przy furtce i słupkach ogrodzenia
              </h2>
              <p className="text-[14px] md:text-[15px] text-neutral-800">
                Zadaszenie możesz posadowić na dedykowanych słupach
                ogrodzeniowych lub dosunąć do ściany budynku. Stałe wymiary
                katalogowe ułatwiają przygotowanie fundamentu i planowanie
                instalacji elektrycznych. Konfigurator zbiera dane o dekorze
                HPL, kolorze stelaża oraz uwagach montażowych – na tej bazie
                przygotujemy rysunki techniczne i wiążącą ofertę.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-neutral-100">
              <Image
                src="/products/slab-fence-zadaszenie-detail.jpg"
                alt="Zadaszenie SLAB FENCE – wizualizacja"
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
              href="https://www.trespa.com/pl_PL/sample-selector"
              target="_blank"
              rel="noreferrer"
              className="rounded-3xl bg-accent border border-border p-4 shadow-soft hover:border-accent hover:text-accent transition-colors"
            >
              <p className="font-bold mb-1 uppercase text-center text-white">
                Wzory płyt Trespa HPL
              </p>
              <p className="text-white text-center">
                Przeglądaj pełną paletę dekorów Trespa i dobierz wzór dla
                ogrodzenia, bramy, furtki i zadaszenia.
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
                Pełna specyfikacja ogrodzeń SLAB FENCE, Stand Up oraz
                dodatków.
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
                Szczegóły gwarancji na konstrukcje stalowe i płyty fasadowe
                HPL w systemie SLAB FENCE.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
