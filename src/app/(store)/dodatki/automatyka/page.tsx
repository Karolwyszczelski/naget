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

/**
 * KONFIGURATOR – AUTOMATYKA / WIDEODOMOFONY
 * ----------------------------------------------------
 */

const basePrice = 3200; // orientacyjna cena bazowa typowego zestawu automatyki

const systemTypes = [
  {
    id: "dwuskrzydlowa",
    label: "Automatyka do bramy dwuskrzydłowej",
    factor: 1.0,
  },
  {
    id: "przesuwna",
    label: "Automatyka do bramy przesuwnej",
    factor: 1.05,
  },
  {
    id: "wejsciowy",
    label: "Zestaw wejściowy / wideodomofon bez napędu",
    factor: 0.8,
  },
] as const;

const usageIntensities = [
  {
    id: "domowa",
    label: "Użytkowanie domowe (do ok. 20 cykli/dobę)",
    factor: 1.0,
  },
  {
    id: "polintensywna",
    label: "Użytkowanie półintensywne (małe wspólnoty, biura)",
    factor: 1.12,
  },
  {
    id: "intensywna",
    label: "Użytkowanie intensywne (osiedla, pensjonaty, hotele)",
    factor: 1.25,
  },
] as const;

const brandPreferences = [
  { id: "bez-preferencji", label: "Bez preferencji – dobierzcie optymalny zestaw" },
  { id: "faac", label: "FAAC" },
  { id: "nice", label: "Nice" },
  { id: "somfy", label: "Somfy" },
  { id: "vidos", label: "Vidos (systemy wejściowe)" },
] as const;

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

type SystemTypeId = (typeof systemTypes)[number]["id"];
type UsageIntensityId = (typeof usageIntensities)[number]["id"];
type BrandPreferenceId = (typeof brandPreferences)[number]["id"];

type IntercomOption =
  | "brak"
  | "domofon"
  | "wideodomofon"
  | "tylko-przygotowanie";

type ColorMode = "standard" | "custom";

type Step = 1 | 2 | 3 | 4;

type StepDef = {
  id: Step;
  label: string;
  icon: IconType;
};

export default function AddonsAutomatykaPage() {
  const { addItem } = useCart();

  const [step, setStep] = useState<Step>(1);

  const steps: StepDef[] = [
    { id: 1, label: "Rodzaj zestawu", icon: FaBorderAll },
    { id: 2, label: "Parametry bramy", icon: FaRulerCombined },
    { id: 3, label: "Preferencje zestawu", icon: FaPalette },
    { id: 4, label: "Podsumowanie", icon: FaClipboardCheck },
  ];

  const handleNextStep = () =>
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  const handlePrevStep = () =>
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  // STEP 1 – rodzaj zestawu i intensywność pracy
  const [systemTypeId, setSystemTypeId] =
    useState<SystemTypeId>("dwuskrzydlowa");
  const [usageIntensityId, setUsageIntensityId] =
    useState<UsageIntensityId>("domowa");
  const [brandPreferenceId, setBrandPreferenceId] =
    useState<BrandPreferenceId>("bez-preferencji");

  // STEP 2 – parametry bramy
  const [widthCm, setWidthCm] = useState<number | "">("");
  const [gateWeightKg, setGateWeightKg] = useState<number | "">("");
  const [hasGateAlready, setHasGateAlready] = useState<boolean>(true);

  // STEP 3 – kolor, dodatki, system wejściowy
  const [colorMode, setColorMode] = useState<ColorMode>("standard");
  const [colorId, setColorId] = useState<string>(baseColors[1].id);
  const [customRalCode, setCustomRalCode] = useState<string>("");
  const [finishId, setFinishId] = useState<FinishId>("mat");

  const [intercomOption, setIntercomOption] =
    useState<IntercomOption>("brak");

  const [hasPhotocells, setHasPhotocells] = useState<boolean>(true);
  const [hasFlashingLight, setHasFlashingLight] = useState<boolean>(true);
  const [hasWifiModule, setHasWifiModule] = useState<boolean>(false);
  const [hasBackupBattery, setHasBackupBattery] = useState<boolean>(false);
  const [hasKeySwitch, setHasKeySwitch] = useState<boolean>(false);

  const [note, setNote] = useState<string>("");

  // ILOŚĆ
  const [quantity, setQuantity] = useState<number>(1);

  const selectedSystemType =
    systemTypes.find((s) => s.id === systemTypeId) ?? systemTypes[0];
  const selectedUsageIntensity =
    usageIntensities.find((u) => u.id === usageIntensityId) ??
    usageIntensities[0];
  const selectedBrandPreference =
    brandPreferences.find((b) => b.id === brandPreferenceId) ??
    brandPreferences[0];

  const selectedBaseColor =
    baseColors.find((c) => c.id === colorId) ?? baseColors[1];
  const selectedFinish =
    finishOptions.find((f) => f.id === finishId) ?? finishOptions[0];

  const previewColorHex =
    colorMode === "standard" ? selectedBaseColor.hex : "#383E4A";

  // CENA – orientacyjna
  const { unitPrice, priceLabel, totalLabel } = useMemo(() => {
    let factor = 1.0;

    factor *= selectedSystemType.factor;
    factor *= selectedUsageIntensity.factor;
    factor *= selectedFinish.factor;

    // wymiar / waga bramy – tylko dla zestawów z napędem
    if (selectedSystemType.id !== "wejsciowy") {
      const w =
        typeof widthCm === "number" && widthCm > 0 ? widthCm : 400;
      const weight =
        typeof gateWeightKg === "number" && gateWeightKg > 0
          ? gateWeightKg
          : 300;

      const widthFactor = Math.max(0.8, Math.min(1.6, w / 400));
      const weightFactor = Math.max(0.8, Math.min(1.5, weight / 300));

      factor *= 0.5 + 0.5 * widthFactor;
      factor *= 0.5 + 0.5 * weightFactor;
    }

    if (colorMode === "custom") {
      factor *= 1.04;
    }

    if (hasPhotocells) factor *= 1.05;
    if (hasFlashingLight) factor *= 1.03;
    if (hasWifiModule) factor *= 1.07;
    if (hasBackupBattery) factor *= 1.08;
    if (hasKeySwitch) factor *= 1.03;

    if (intercomOption === "domofon") factor *= 1.15;
    if (intercomOption === "wideodomofon") factor *= 1.35;
    if (intercomOption === "tylko-przygotowanie") factor *= 1.05;

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
    selectedSystemType.factor,
    selectedSystemType.id,
    selectedUsageIntensity.factor,
    selectedFinish.factor,
    widthCm,
    gateWeightKg,
    colorMode,
    hasPhotocells,
    hasFlashingLight,
    hasWifiModule,
    hasBackupBattery,
    hasKeySwitch,
    intercomOption,
    quantity,
  ]);

  // DODANIE DO KOSZYKA
  const handleAddToCart = () => {
    const widthVal =
      typeof widthCm === "number" && widthCm > 0 ? widthCm : undefined;
    const weightVal =
      typeof gateWeightKg === "number" && gateWeightKg > 0
        ? gateWeightKg
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
      productId: "addons-automatyka",
      name: "Automatyka do bram / system wejściowy",
      series: "addons",
      unitPrice,
      quantity: Math.max(quantity, 1),
      config: {
        systemTypeId: selectedSystemType.id,
        systemTypeLabel: selectedSystemType.label,
        usageIntensityId: selectedUsageIntensity.id,
        usageIntensityLabel: selectedUsageIntensity.label,
        brandPreferenceId: selectedBrandPreference.id,
        brandPreferenceLabel: selectedBrandPreference.label,
        widthCm: widthVal,
        gateWeightKg: weightVal,
        hasGateAlready,
        colorMode: colorMode === "standard" ? "standard" : "custom-ral",
        colorId: colorIdForCart,
        colorName,
        customRalCode:
          colorMode === "custom" && customRalCode ? customRalCode : undefined,
        finishId: selectedFinish.id,
        finishLabel: selectedFinish.label,
        intercomOption,
        hasPhotocells,
        hasFlashingLight,
        hasWifiModule,
        hasBackupBattery,
        hasKeySwitch,
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
              Dodatki – automatyka, domofony, wideodomofony
            </p>
            <h1 className="text-[26px] md:text-[40px] font-extrabold text-accent uppercase">
              Automatyka do bram + systemy wejściowe
            </h1>
            <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
              Jesteśmy dystrybutorem napędów do bram dwuskrzydłowych oraz
              przesuwnych, a także wideofonów i domofonów marek{" "}
              <strong>FAAC, NICE, VIDOS, SOMFY</strong>. Na podstawie
              konfiguracji dobierzemy kompletny zestaw: napędy, centrale,
              akcesoria bezpieczeństwa oraz system wejściowy dopasowany do
              Twojego ogrodzenia NAGET.
            </p>
          </header>

          {/* 2 KOLUMNY – PODGLĄD + KONFIGURATOR */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,3fr)] items-start">
            {/* LEWA – GRAFIKA / LOGOTYPY */}
            <div className="space-y-4">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-neutral-50">
                <Image
                  src="/products/addons-automatyka-main.jpg"
                  alt="Automatyka do bram – wizualizacja zestawu"
                  fill
                  className="object-contain object-center"
                />
              </div>
              <div className="rounded-3xl bg-white/80 border border-border p-4 space-y-3 text-[12px] text-neutral-700">
                <p className="font-semibold text-primary text-center text-[13px]">
                  Dystrybuujemy automatykę i systemy wejściowe marek:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Image
                    src="/brands/faac-logo.png"
                    alt="FAAC"
                    width={90}
                    height={40}
                  />
                  <Image
                    src="/brands/somfy-logo.png"
                    alt="Somfy"
                    width={90}
                    height={40}
                  />
                  <Image
                    src="/brands/vidos-logo.png"
                    alt="Vidos"
                    width={90}
                    height={40}
                  />
                  <Image
                    src="/brands/nice-logo.png"
                    alt="Nice"
                    width={90}
                    height={40}
                  />
                </div>
                <p className="text-[11px] text-neutral-500 text-center">
                  Logotypy mają charakter poglądowy. Dobór producenta i
                  konkretnych modeli odbywa się na etapie przygotowania oferty.
                </p>
              </div>
            </div>

            {/* PRAWA – KONFIGURATOR */}
            <div className="rounded-3xl border border-border bg-white/80 p-5 md:p-6 space-y-6 shadow-soft">
              <h2 className="text-[18px] md:text-[20px] font-bold text-primary mb-1">
                Konfigurator zestawu automatyki
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

              {/* KROK 1 – RODZAJ ZESTAWU */}
              {step === 1 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 1 · Rodzaj zestawu i intensywność pracy
                  </p>

                  <div className="space-y-3">
                    <p className="text-[12px] font-semibold text-primary">
                      Jakiej bramy / systemu dotyczy zapytanie?
                    </p>
                    <div className="space-y-2">
                      {systemTypes.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSystemTypeId(s.id)}
                          className={`w-full text-left rounded-2xl border px-3 py-2 text-[12px] ${
                            systemTypeId === s.id
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          <span className="block font-semibold">
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[12px] font-semibold text-primary">
                      Intensywność użytkowania
                    </p>
                    <div className="flex flex-wrap gap-2 text-[12px]">
                      {usageIntensities.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setUsageIntensityId(u.id)}
                          className={`px-3 py-1 rounded-full border ${
                            usageIntensityId === u.id
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      Preferowana marka automatyki
                    </p>
                    <div className="flex flex-wrap gap-2 text-[12px]">
                      {brandPreferences.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBrandPreferenceId(b.id)}
                          className={`px-3 py-1 rounded-full border ${
                            brandPreferenceId === b.id
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* KROK 2 – PARAMETRY BRAMY */}
              {step === 2 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 2 · Parametry bramy
                  </p>

                  {systemTypeId === "wejsciowy" ? (
                    <p className="text-[12px] text-neutral-700">
                      Wybrałeś zestaw wejściowy bez napędu bramy (domofon /
                      wideodomofon). Jeśli przy furtce lub bramie ma być
                      napęd, wróć do poprzedniego kroku i wybierz typ bramy.
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 text-[12px]">
                        <div>
                          <p className="font-semibold text-primary mb-1">
                            Szerokość światła bramy (cm)
                          </p>
                          <input
                            type="number"
                            min={250}
                            max={900}
                            value={widthCm}
                            onChange={(e) =>
                              setWidthCm(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                            className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            placeholder="np. 400, 500, 600..."
                          />
                          <p className="mt-1 text-[11px] text-neutral-500">
                            Przybliżona szerokość światła wjazdu. Dokładne
                            wymiary zweryfikujemy na etapie projektu.
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-primary mb-1">
                            Szacunkowa waga bramy (kg)
                          </p>
                          <input
                            type="number"
                            min={150}
                            max={1200}
                            value={gateWeightKg}
                            onChange={(e) =>
                              setGateWeightKg(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                            className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            placeholder="jeśli nie wiesz – zostaw puste"
                          />
                          <p className="mt-1 text-[11px] text-neutral-500">
                            Wystarczy przybliżony zakres. Dobierzemy napęd z
                            zapasem mocy.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[12px] font-semibold text-primary">
                          Czy brama już istnieje?
                        </p>
                        <label className="flex items-center gap-2 text-[12px]">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={hasGateAlready}
                            onChange={(e) =>
                              setHasGateAlready(e.target.checked)
                            }
                          />
                          <span>
                            Tak, brama jest już zamontowana – potrzebna jest
                            tylko automatyka
                          </span>
                        </label>
                        <p className="text-[11px] text-neutral-500">
                          Jeśli brama jest w projekcie lub w produkcji,
                          zaznacz i doprecyzuj to w uwagach w kroku 3.
                        </p>
                      </div>
                    </>
                  )}
                </section>
              )}

              {/* KROK 3 – PREFERENCJE ZESTAWU */}
              {step === 3 && (
                <section className="space-y-4 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 3 · Preferencje zestawu i system wejściowy
                  </p>

                  {/* Kolor i struktura (dla słupka / akcesoriów widocznych) */}
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      Kolor elementów widocznych (np. słupek, obudowy)
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
                          od wybranego odcienia i producenta.
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
                        Struktura obudów / słupków
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

                  {/* Akcesoria bezpieczeństwa i komfortu */}
                  {systemTypeId !== "wejsciowy" && (
                    <div className="space-y-2">
                      <p className="text-[12px] font-semibold text-primary">
                        Akcesoria do napędu bramy
                      </p>
                      <div className="grid gap-2 text-[12px]">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={hasPhotocells}
                            onChange={(e) =>
                              setHasPhotocells(e.target.checked)
                            }
                          />
                          <span>Fotokomórki bezpieczeństwa</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={hasFlashingLight}
                            onChange={(e) =>
                              setHasFlashingLight(e.target.checked)
                            }
                          />
                          <span>Lampa ostrzegawcza LED</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={hasWifiModule}
                            onChange={(e) =>
                              setHasWifiModule(e.target.checked)
                            }
                          />
                          <span>Moduł Wi-Fi / sterowanie smartfonem</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={hasBackupBattery}
                            onChange={(e) =>
                              setHasBackupBattery(e.target.checked)
                            }
                          />
                          <span>Zasilanie awaryjne (akumulator)</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={hasKeySwitch}
                            onChange={(e) =>
                              setHasKeySwitch(e.target.checked)
                            }
                          />
                          <span>Stacyjka kluczykowa / przycisk wejściowy</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* System wejściowy */}
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      System wejściowy przy furtce / bramie
                    </p>
                    <div className="flex flex-wrap gap-2 text-[12px]">
                      {(
                        [
                          "brak",
                          "domofon",
                          "wideodomofon",
                          "tylko-przygotowanie",
                        ] as IntercomOption[]
                      ).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setIntercomOption(opt)}
                          className={`px-3 py-1 rounded-full border ${
                            intercomOption === opt
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          {opt === "brak" && "Bez domofonu / wideodomofonu"}
                          {opt === "domofon" && "Domofon audio"}
                          {opt === "wideodomofon" && "Wideodomofon"}
                          {opt === "tylko-przygotowanie" &&
                            "Tylko przygotowanie okablowania"}
                        </button>
                      ))}
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
                      placeholder="Np. miejsce sterowania, liczba pilotów, integracja z systemem smart home, istniejąca instalacja domofonowa..."
                    />
                  </div>
                </section>
              )}

              {/* KROK 4 – PODSUMOWANIE */}
              {step === 4 && (
                <section className="space-y-5 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Krok 4 · Ilość zestawów i podsumowanie
                  </p>

                  <div className="flex items-center gap-3">
                    <p className="text-[12px] font-semibold text-primary">
                      Ilość zestawów
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
                        Typ zestawu:{" "}
                        <strong className="text-primary">
                          {selectedSystemType.label}
                        </strong>
                      </p>
                      <p>
                        Intensywność pracy:{" "}
                        <strong className="text-primary">
                          {selectedUsageIntensity.label}
                        </strong>
                      </p>
                      <p>
                        Preferowana marka:{" "}
                        <strong className="text-primary">
                          {selectedBrandPreference.label}
                        </strong>
                      </p>
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
                        Cena ma charakter orientacyjny i służy do wstępnego
                        budżetowania inwestycji. Wiążącą wycenę przygotujemy po
                        analizie konfiguracji, projektu bramy oraz sposobu
                        montażu.
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
                      Po dodaniu konfiguracji automatyki do koszyka otrzymamy
                      od Ciebie komplet informacji o bramie, intensywności
                      pracy i wymaganiach dotyczących systemu wejściowego. Na
                      tej podstawie specjaliści NAGET dobiorą konkretne modele
                      napędów i wideodomofonów FAAC, NICE, VIDOS lub SOMFY oraz
                      przygotują wiążącą ofertę wraz z montażem.
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
                    Dodaj konfigurację automatyki do koszyka
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OPISY POD KONFIGURATOREM */}
          <section className="space-y-3">
            <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase text-center">
              Kompletny zestaw: napęd, bezpieczeństwo, komunikacja
            </h2>
            <p className="text-[14px] md:text-[15px] text-neutral-800 text-center max-w-4xl mx-auto">
              W jednym miejscu dobieramy napęd do bramy, akcesoria
              bezpieczeństwa oraz system wejściowy – domofon lub
              wideodomofon. Dzięki temu inwestor ma pewność, że wszystkie
              elementy będą ze sobą współpracować, a ekipa montażowa otrzyma
              spójny projekt i listę urządzeń do instalacji.
            </p>
          </section>

          <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
            <div className="space-y-3">
              <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase">
                Integracja z ogrodzeniem NAGET
              </h2>
              <p className="text-[14px] md:text-[15px] text-neutral-800">
                Projektując ogrodzenia Stand Up, Slab Fence czy Royal,
                przewidujemy od razu miejsce na automatykę, słupki
                multimedialne oraz prowadzenie okablowania. Konfigurator
                automatyki porządkuje informacje o typie bramy, intensywności
                pracy, preferowanych markach i wyposażeniu, dzięki czemu
                łatwiej jest przygotować dopasowaną ofertę i dokumentację dla
                wykonawcy.
              </p>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-neutral-100">
              <Image
                src="/products/addons-automatyka-detail.jpg"
                alt="Automatyka do bram – detal instalacji"
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
                Ułatwia dobranie koloru słupków, obudów i słupków
                multimedialnych do ogrodzenia.
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
                Zestawienie ogrodzeń, bram, słupków multimedialnych i dodatków.
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
                Szczegóły gwarancji na napędy i osprzęt automatyki montowane w
                ogrodzeniach NAGET.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
