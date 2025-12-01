// app/koszyk/page.tsx
"use client";

import { useMemo, useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FaBorderAll,
  FaUser,
  FaTruck,
  FaClipboardCheck,
  FaCheckCircle,
  FaTrash,
} from "react-icons/fa";
import Link from "next/link";
import { useCart } from "../CartContext";

// MODELE 3D
import FurtkaModel from "../components/FurtkaModel";
import BramaStandupPrzesuwnaModel from "../components/BramaPrzesuwnaModel";
import ZadaszenieStandup from "../components/zadaszenie-standupmodel";
import BramaStandUpSkrzydlowaModel from "../components/BramaDwuskrzydlowaModel";
import DrewutniaModel from "../components/DrewutnieModel";
import SlabFenceBramaDwuskrzydlowamodel from "../components/Slab-Bramadwuskrzydlowamodel";
import SlabFenceBramaPrzesuwnamodel from "../components/slab-bramaprzesuwnamodel";
import SlabFurtkaModel from "../components/SlabFurtkaModel";
import Slabzadaszeniemodel from "../components/Slabzadaszeniemodel";
import SlupekMultiModel from "../components/Slupekmultimodel";

type Step = 1 | 2 | 3 | 4 | 5;
type CustomerType = "b2c" | "b2b";

type CustomerData = {
  type: CustomerType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  nip: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  googlePlaceId?: string;
};

type DeliveryMethod = "transport" | "pickup";

type DeliveryData = {
  method: DeliveryMethod;
  basePrice: number;
  note?: string;
};

type DiscountState = {
  code: string;
  amount: number;
  message?: string;
  error?: string;
};

// podstawowe mapowanie po productId
const CONFIG_ROUTES: Record<string, string> = {
  "standup-furtka": "/stand-up/furtka",
  "standup-brama": "/stand-up/brama-przesuwna",
  "standup-brama-przesuwna": "/stand-up/brama-przesuwna",
  "standup-zadaszenie": "/stand-up/zadaszenie",
  "standup-brama-skrzydlowa": "/stand-up/brama-skrzydlowa",

  "slab-furtka": "/slab-fence/furtka",
  "slab-brama": "/slab-fence/brama-przesuwna",
  "slab-brama-przesuwna": "/slab-fence/brama-przesuwna",
  "slab-brama-skrzydlowa": "/slab-fence/brama-skrzydlowa",
  "slab-zadaszenie": "/slab-fence/zadaszenie",

  "addons-automat": "/dodatki/automatyka",
  "addons-drewutnie": "/dodatki/drewutnie",
  "addons-slupki": "/dodatki/slupki-multimedialne-paczkomaty",
  "addons-slupki-multimedialne": "/dodatki/slupki-multimedialne-paczkomaty",
  "addons-slupki-multimedialne-paczkomaty":
    "/dodatki/slupki-multimedialne-paczkomaty",
};

// dodatkowe heurystyki po nazwie, gdy productId nie pasuje
function getConfiguratorHref(productId: string, itemName: string): string | null {
  if (CONFIG_ROUTES[productId]) return CONFIG_ROUTES[productId];

  const name = (itemName || "").toLowerCase();

  if (name.includes("brama przesuwna stand up")) return "/stand-up/brama-przesuwna";
  if (name.includes("furtka stand up")) return "/stand-up/furtka";
  if (name.includes("zadaszenie stand up")) return "/stand-up/zadaszenie";

  if (name.includes("slab fence") && name.includes("furtka"))
    return "/slab-fence/furtka";
  if (name.includes("slab fence") && name.includes("przesuwna"))
    return "/slab-fence/brama-przesuwna";
  if (name.includes("slab fence") && name.includes("dwuskrzyd"))
    return "/slab-fence/brama-skrzydlowa";
  if (name.includes("slab fence") && name.includes("zadaszenie"))
    return "/slab-fence/zadaszenie";

  if (name.includes("słupki multimedialne"))
    return "/dodatki/slupki-multimedialne-paczkomaty";
  if (name.includes("drewutnia")) return "/dodatki/drewutnie";
  if (name.includes("automatyka") || name.includes("napęd"))
    return "/dodatki/automatyka";

  return null;
}

export default function CartPage() {
  const { items, totalAmount, removeItem, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);

  const [customer, setCustomer] = useState<CustomerData>({
    type: "b2c",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    nip: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    city: "",
    country: "Polska",
  });

  const [delivery, setDelivery] = useState<DeliveryData>({
    method: "transport",
    basePrice: 500,
  });

  const [discount, setDiscount] = useState<DiscountState>({
    code: "",
    amount: 0,
  });

  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderPublicId, setOrderPublicId] = useState<string | null>(null);

  const cartTotal = totalAmount;
  const deliveryCost = delivery.method === "transport" ? delivery.basePrice : 0;
  const discountAmount = discount.amount;
  const grandTotal = Math.max(
    0,
    cartTotal + deliveryCost - (discountAmount || 0)
  );

  const formattedCartTotal = cartTotal.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
  const formattedDelivery = deliveryCost.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
  const formattedDiscount = discountAmount.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
  const formattedGrandTotal = grandTotal.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });

  const steps = useMemo(
    () => [
      { id: 1 as Step, label: "Koszyk", icon: FaBorderAll },
      { id: 2 as Step, label: "Dane osobowe", icon: FaUser },
      { id: 3 as Step, label: "Dostawa", icon: FaTruck },
      { id: 4 as Step, label: "Podsumowanie", icon: FaClipboardCheck },
      { id: 5 as Step, label: "Podziękowanie", icon: FaCheckCircle },
    ],
    []
  );

  const handleNext = () => {
    setStep((prev) => (prev < 5 ? ((prev + 1) as Step) : prev));
  };

  const handlePrev = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const validateCustomerStep = (): string | null => {
    if (!customer.firstName.trim()) return "Podaj imię.";
    if (!customer.lastName.trim()) return "Podaj nazwisko.";
    if (!customer.email.trim()) return "Podaj adres e-mail.";
    if (!customer.phone.trim()) return "Podaj numer telefonu.";
    if (!customer.addressLine1.trim()) return "Podaj ulicę i numer.";
    if (!customer.postalCode.trim()) return "Podaj kod pocztowy.";
    if (!customer.city.trim()) return "Podaj miejscowość.";
    if (customer.type === "b2b" && !customer.companyName.trim())
      return "Podaj nazwę firmy.";
    return null;
  };

  const [customerError, setCustomerError] = useState<string | null>(null);

  const goFromCustomerToDelivery = () => {
    const err = validateCustomerStep();
    if (err) {
      setCustomerError(err);
      return;
    }
    setCustomerError(null);
    setStep(3);
  };

  const handleApplyDiscount = (e: FormEvent) => {
    e.preventDefault();
    const raw = discount.code.trim().toUpperCase();
    if (!raw) {
      setDiscount((prev) => ({
        ...prev,
        amount: 0,
        message: undefined,
        error: "Wpisz kod rabatowy.",
      }));
      return;
    }

    if (raw === "NAGET2025") {
      const amount = Math.round(cartTotal * 0.05);
      setDiscount({
        code: raw,
        amount,
        message: "Zastosowano rabat 5% na wartość produktów.",
        error: undefined,
      });
    } else if (raw === "TRANSPORT0") {
      setDiscount({
        code: raw,
        amount: deliveryCost,
        message: "Rabat na podstawowy koszt transportu.",
        error: undefined,
      });
    } else {
      setDiscount({
        code: raw,
        amount: 0,
        message: undefined,
        error: "Nieprawidłowy lub nieaktywny kod rabatowy.",
      });
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    removeItem(cartItemId);
  };

  const handlePlaceOrder = async () => {
    if (!items.length) return;

    const err = validateCustomerStep();
    if (err) {
      setCustomerError(err);
      setStep(2);
      return;
    }

    setSavingOrder(true);
    setOrderError(null);

    try {
      const payload = {
        customer,
        delivery,
        discount: {
          code: discount.code || null,
          amount: discount.amount,
        },
        cart: {
          items: items.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            series: item.series,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            config: item.config ?? null,
          })),
          totals: {
            cartTotal,
            delivery: deliveryCost,
            discount: discountAmount,
            grandTotal,
          },
        },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Order POST failed");
      }

      const data: any = await res.json().catch(() => ({}));
      setOrderPublicId(data.publicId ?? null);

      clearCart();
      setStep(5);
    } catch (error) {
      console.error("Order POST error", error);
      setOrderError(
        "Nie udało się zapisać zamówienia. Spróbuj ponownie lub skontaktuj się z nami."
      );
    } finally {
      setSavingOrder(false);
    }
  };

  const goBackToShop = () => {
    router.push("/");
  };

  return (
    <main className="section bg-transparent">
      <div className="container space-y-8">
        {/* NAGŁÓWEK STRONY */}
        <header className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
            Proces zamówienia
          </p>
          <h1 className="text-[26px] md:text-[32px] font-extrabold text-accent">
            Konfiguracja zamówienia i dostawy
          </h1>
          <p className="text-[14px] md:text-[15px] text-neutral-800 max-w-3xl">
            Poniżej w kilku krokach przeprowadzimy Cię od weryfikacji koszyka,
            przez dane do faktury i wysyłki, aż po zapisanie zamówienia w
            systemie. Ceny transportu mają charakter orientacyjny – finalny
            koszt potwierdzimy po weryfikacji gabarytów i trasy.
          </p>
        </header>

        {/* PASEK KROKÓW */}
        <div className="w-full flex justify-center">
          <div className="inline-flex items-center gap-4 overflow-x-auto pb-4">
            {steps.map((s, index) => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              const Icon = s.icon;

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 flex-none min-w-[160px] md:min-w-[210px]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id <= step) setStep(s.id);
                    }}
                    className="flex flex-col items-center gap-2 focus:outline-none"
                  >
                    <div
                      className={[
                        "flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-full border text-[18px] md:text-[20px] transition-colors",
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
                        "text-[11px] md:text-[12px] font-semibold tracking-[0.16em] uppercase text-center",
                        isActive ? "text-primary" : "text-neutral-500/70",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {s.label}
                    </span>
                  </button>

                  {index < steps.length - 1 && (
                    <span
                      className={
                        "h-[2px] w-10 md:w-20 flex-none rounded-full " +
                        (step > s.id ? "bg-accent" : "bg-neutral-300/70")
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* KROK 1 – KOSZYK */}
        {step === 1 && (
          <section className="space-y-6 border-t border-border/60 pt-4">
            {items.length === 0 ? (
              <div className="rounded-3xl border border-border bg-white/60 p-6 text-center space-y-3">
                <p className="text-[15px] font-semibold text-primary">
                  Twój koszyk jest pusty.
                </p>
                <p className="text-[13px] text-neutral-700">
                  Dodaj produkty z konfiguratorów bram, furtek lub zadaszeń,
                  aby przejść dalej.
                </p>
                <button
                  type="button"
                  onClick={goBackToShop}
                  className="btn btn-sm px-5"
                >
                  Wróć do sklepu
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-6">
                  {items.map((item) => {
                    const config: any = item.config ?? {};

                    const colorHex = config.colorHex || "#383E4A";
                    const finishId = config.finishId || config.finish || "mat";
                    const profileId =
                      config.profileId || config.profile || "60x40";
                    const spacingId =
                      config.spacingId ||
                      (config.spacingCm ? String(config.spacingCm) : "6");
                    const fillType = config.fillType || "prosta";

                    const panelTextureUrl =
                      config.panelTextureUrl ||
                      config.panelTexture ||
                      undefined;
                    const panelLabel =
                      config.panelLabel ||
                      config.panelName ||
                      config.panel ||
                      undefined;
                    const handleVariant =
                      config.handleVariant || ("flat" as const);

                    const linePrice =
                      item.unitPrice * (item.quantity ?? 1);

                    const configuratorHref = getConfiguratorHref(
                      item.productId,
                      item.name
                    );

                    const pid = item.productId || "";
                    const name = (item.name || "").toLowerCase();
                    const series = (item.series || "").toLowerCase();

                    const renderPreview = () => {
                      // STAND UP – furtka
                      if (
                        pid === "standup-furtka" ||
                        name.includes("furtka stand up")
                      ) {
                        return (
                          <FurtkaModel
                            colorHex={colorHex}
                            finish={finishId}
                            profileId={profileId}
                            spacingId={spacingId}
                            fillType={fillType}
                          />
                        );
                      }

                      // STAND UP – brama przesuwna
                      if (
                        pid === "standup-brama" ||
                        pid === "standup-brama-przesuwna" ||
                        name.includes("brama przesuwna stand up")
                      ) {
                        return (
                          <BramaStandupPrzesuwnaModel
                            colorHex={colorHex}
                            finish={finishId}
                            profileId={profileId}
                            spacingId={spacingId}
                            fillType={fillType}
                          />
                        );
                      }

                      // STAND UP – brama dwuskrzydłowa
if (
  pid === "standup-brama-skrzydlowa" ||
  (series.includes("stand") && name.includes("dwuskrzyd"))
) {
  return (
    <BramaStandUpSkrzydlowaModel
      colorHex={colorHex}
      finish={finishId}
      profileId={profileId}
      spacingId={spacingId}
      fillType={fillType}
    />
  );
}

                      // STAND UP – zadaszenie
                      if (
                        pid === "standup-zadaszenie" ||
                        name.includes("zadaszenie stand up")
                      ) {
                        return (
                          <ZadaszenieStandup
                            colorHex={colorHex}
                            finish={finishId}
                          />
                        );
                      }

                      // SLAB – furtka
                      if (
                        pid === "slab-furtka" ||
                        (series.includes("slab") &&
                          name.includes("furtka"))
                      ) {
                        return (
                          <SlabFurtkaModel
                            colorHex={colorHex}
                            finish={finishId}
                            panelTextureUrl={panelTextureUrl}
                            panelLabel={panelLabel}
                            handleVariant={handleVariant}
                          />
                        );
                      }

                      // SLAB – brama przesuwna
                      if (
                        pid === "slab-brama" ||
                        pid === "slab-brama-przesuwna" ||
                        (series.includes("slab") &&
                          name.includes("brama przesuwna"))
                      ) {
                        return (
                          <SlabFenceBramaPrzesuwnamodel
                            colorHex={colorHex}
                            finish={finishId}
                          />
                        );
                      }

                     // SLAB – brama dwuskrzydłowa
if (
  pid === "slab-brama-skrzydlowa" ||
  (series.includes("slab") && name.includes("dwuskrzyd"))
) {
  return (
    <SlabFenceBramaDwuskrzydlowamodel
      colorHex={colorHex}
      finish={finishId}
      panelTextureUrl={panelTextureUrl}
      panelLabel={panelLabel}
    />
  );
}

                      // SLAB – zadaszenie
                      if (
                        pid === "slab-zadaszenie" ||
                        (series.includes("slab") &&
                          name.includes("zadaszenie"))
                      ) {
                        return (
                          <Slabzadaszeniemodel
                            colorHex={colorHex}
                            finish={finishId}
                          />
                        );
                      }

                      // DODATKI – drewutnie
                      if (
                        pid === "addons-drewutnie" ||
                        name.includes("drewutnia")
                      ) {
                        return (
                          <DrewutniaModel
                            colorHex={colorHex}
                            finish={finishId}
                          />
                        );
                      }

                      // DODATKI – słupki multimedialne (model 3D)
                      if (
                        pid === "addons-slupki" ||
                        pid === "addons-slupki-multimedialne" ||
                        pid === "addons-slupki-multimedialne-paczkomaty" ||
                        name.includes("słupki multimedialne") ||
                        name.includes("słupek multimedialny")
                      ) {
                        return (
                          <SlupekMultiModel
                            colorHex={colorHex}
                            finish={finishId}
                          />
                        );
                      }

                      // DODATKI – automatyka (świadomie ZDJĘCIE, nie model 3D)
                      if (
                        pid === "addons-automat" ||
                        name.includes("automatyka") ||
                        name.includes("napęd")
                      ) {
                        return (
                          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-white/40">
                            <Image
                              src="/products/automatyka.png"
                              alt={item.name}
                              fill
                              className="object-contain object-center"
                            />
                          </div>
                        );
                      }

                      // Fallback – obrazek standup bramy
                      return (
                        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-white/40">
                          <Image
                            src="/products/standup-brama.png"
                            alt={item.name}
                            fill
                            className="object-contain object-center"
                          />
                        </div>
                      );
                    };

                    return (
                      <article
                        key={item.id}
                        className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start rounded-3xl border border-border bg-transparent p-4 md:p-5"
                      >
                        {/* LEWO – podgląd */}
                        <div className="space-y-3">
                          <div className="rounded-3xl overflow-hidden bg-transparent">
                            {renderPreview()}
                          </div>

                          <p className="text-[11px] text-neutral-500">
                            Konfiguracja jest zapisana w koszyku. Na etapie
                            przygotowania oferty weryfikujemy wymiary, rozstaw
                            profili i sposób montażu.
                          </p>
                        </div>

                        {/* PRAWO – szczegóły, cena, akcje */}
                        <div className="flex flex-col h-full space-y-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
                              {item.series === "stand-up" && "Seria Stand Up"}
                              {item.series === "slab-fence" &&
                                "Seria Slab Fence"}
                            </p>
                            <h2 className="text-[18px] md:text-[20px] font-bold text-primary">
                              {item.name}
                            </h2>
                          </div>

                          <div className="grid gap-1 text-[13px] text-neutral-800">
                            {config.variant && (
                              <p>
                                Wariant:{" "}
                                <strong>
                                  {config.variant === "custom"
                                    ? "Na wymiar"
                                    : "Standard"}
                                </strong>
                              </p>
                            )}
                            {config.heightLabel && (
                              <p>
                                Wysokość:{" "}
                                <strong>{config.heightLabel}</strong>
                              </p>
                            )}
                            {config.widthMm && (
                              <p>
                                Szerokość światła:{" "}
                                <strong>{config.widthMm} mm</strong>
                              </p>
                            )}
                            {config.fillType && (
                              <p>
                                Wypełnienie:{" "}
                                <strong>
                                  {config.fillType === "twist"
                                    ? "Twist (efekt żaluzji)"
                                    : "Prosty"}
                                </strong>
                              </p>
                            )}
                            {config.profileLabel && (
                              <p>
                                Profil:{" "}
                                <strong>{config.profileLabel}</strong>
                              </p>
                            )}
                            {config.spacingCm && (
                              <p>
                                Rozstaw:{" "}
                                <strong>
                                  ok. {config.spacingCm} cm
                                </strong>
                              </p>
                            )}
                            {config.colorName && (
                              <p>
                                Kolor:{" "}
                                <strong>{config.colorName}</strong>
                              </p>
                            )}
                            {config.finishLabel && (
                              <p>
                                Struktura:{" "}
                                <strong>{config.finishLabel}</strong>
                              </p>
                            )}
                            {panelLabel &&
                              item.productId &&
                              item.productId.startsWith("slab-") && (
                                <p>
                                  Płyta: <strong>{panelLabel}</strong>
                                </p>
                              )}
                          </div>

                          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div className="text-[12px] text-neutral-700 space-y-0.5">
                              <p>
                                Ilość:{" "}
                                <strong>{item.quantity} szt.</strong>
                              </p>
                              <p>
                                Cena jedn.:{" "}
                                <strong className="text-primary">
                                  {item.unitPrice.toLocaleString("pl-PL", {
                                    style: "currency",
                                    currency: "PLN",
                                  })}
                                </strong>
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                                  Razem
                                </p>
                                <p className="text-[18px] font-extrabold text-primary">
                                  {linePrice.toLocaleString("pl-PL", {
                                    style: "currency",
                                    currency: "PLN",
                                  })}
                                </p>
                              </div>

                              <div className="flex flex-wrap justify-end gap-2">
                                {configuratorHref && (
                                  <Link
                                    href={configuratorHref}
                                    className="btn btn-sm btn-outline"
                                  >
                                    Zmień konfigurację
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="btn btn-sm btn-outline border-red-200 text-red-600 hover:border-red-400 hover:text-red-700 flex items-center gap-1"
                                >
                                  <FaTrash className="text-[12px]" />
                                  <span>Usuń</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* NAWIGACJA KROK 1 */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 rounded-2xl border text-[11px] uppercase tracking-[0.14em] border-border text-neutral-400 cursor-not-allowed"
                  >
                    Wstecz
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!items.length}
                    className="btn btn-sm px-6 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Dalej
                  </button>
                </div>

                {/* INFO O PRODUKCJI I TRANSPORCIE */}
                <section className="space-y-4">
                  <h2 className="text-[18px] md:text-[30px] font-extrabold text-accent uppercase text-center">
                    Jak wygląda realizacja zamówienia?
                  </h2>

                  <div className="grid gap-4 md:grid-cols-4 text-[13px] md:text-[14px]">
                    <div className="rounded-3xl border border-border bg-accent p-4 shadow-soft">
                      <p className="text-[9px] uppercase tracking-[0.18em] mb-1 text-white/90 text-center">
                        1 · Projekt i wycena
                      </p>
                      <p className="text-white text-center">
                        Na podstawie konfiguratora przygotowujemy ofertę oraz
                        rysunki techniczne dopasowane do Twojej działki i
                        słupków.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border bg-white/60 p-4 shadow-soft">
                      <p className="text-[9px] uppercase tracking-[0.18em] mb-1 text-accent text-center">
                        2 · Produkcja
                      </p>
                      <p className="text-neutral-800 text-center">
                        Profile są cięte, spawane i szlifowane w naszym
                        zakładzie, a następnie malowane proszkowo w wybranym
                        kolorze RAL.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border bg-accent p-4 shadow-soft">
                      <p className="text-[9px] uppercase tracking-[0.18em] mb-1 text-white/90 text-center">
                        3 · Logistyka
                      </p>
                      <p className="text-white text-center">
                        Dobieramy trasę i środek transportu do gabarytów bram i
                        przęseł. Dzięki własnym samochodom ograniczamy ryzyko
                        uszkodzeń.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border bg-white/60 p-4 shadow-soft">
                      <p className="text-[9px] uppercase tracking-[0.18em] mb-1 text-accent text-center">
                        4 · Dostawa
                      </p>
                      <p className="text-neutral-800 text-center">
                        Wstępny koszt transportu wyliczamy na podstawie
                        gabarytów i odległości od magazynu. Ostateczną kwotę
                        potwierdzamy przed realizacją.
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}
          </section>
        )}

        {/* KROK 2 – DANE OSOBOWE */}
        {step === 2 && (
          <section className="space-y-4 border-t border-border/60 pt-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setCustomer((prev) => ({ ...prev, type: "b2c" }))
                }
                className={`px-4 py-2 rounded-2xl border text-[12px] uppercase tracking-[0.14em] ${
                  customer.type === "b2c"
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                }`}
              >
                Klient indywidualny
              </button>
              <button
                type="button"
                onClick={() =>
                  setCustomer((prev) => ({ ...prev, type: "b2b" }))
                }
                className={`px-4 py-2 rounded-2xl border text-[12px] uppercase tracking-[0.14em] ${
                  customer.type === "b2b"
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-primary border-border hover:border-accent hover:text-accent"
                }`}
              >
                Firma (B2B)
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-700">
                    Imię
                  </label>
                  <input
                    type="text"
                    value={customer.firstName}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-700">
                    Nazwisko
                  </label>
                  <input
                    type="text"
                    value={customer.lastName}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-700">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {customer.type === "b2b" && (
                  <>
                    <div>
                      <label className="block text-[12px] font-semibold text-neutral-700">
                        Nazwa firmy
                      </label>
                      <input
                        type="text"
                        value={customer.companyName}
                        onChange={(e) =>
                          setCustomer((prev) => ({
                            ...prev,
                            companyName: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-neutral-700">
                        NIP
                      </label>
                      <input
                        type="text"
                        value={customer.nip}
                        onChange={(e) =>
                          setCustomer((prev) => ({
                            ...prev,
                            nip: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[12px] font-semibold text-neutral-700">
                    Adres (ulica i nr)
                  </label>
                  <input
                    type="text"
                    value={customer.addressLine1}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        addressLine1: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    placeholder="np. Przykładowa 12"
                  />
                </div>
                <div className="grid grid-cols-[1.2fr_1.8fr] gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-neutral-700">
                      Kod pocztowy
                    </label>
                    <input
                      type="text"
                      value={customer.postalCode}
                      onChange={(e) =>
                        setCustomer((prev) => ({
                          ...prev,
                          postalCode: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="00-000"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-neutral-700">
                      Miejscowość
                    </label>
                    <input
                      type="text"
                      value={customer.city}
                      onChange={(e) =>
                        setCustomer((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-700">
                    Kraj
                  </label>
                  <input
                    type="text"
                    value={customer.country}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {customerError && (
              <p className="text-[12px] text-red-600">{customerError}</p>
            )}
          </section>
        )}

        {/* KROK 3 – DOSTAWA */}
        {step === 3 && (
          <section className="space-y-4 border-t border-border/60 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setDelivery((prev) => ({
                    ...prev,
                    method: "transport",
                    basePrice: 500,
                  }))
                }
                className={`text-left rounded-3xl border p-4 md:p-5 space-y-2 ${
                  delivery.method === "transport"
                    ? "border-accent bg-accent/5"
                    : "border-border bg-white/60 hover:border-accent/70"
                }`}
              >
                <p className="text-[12px] font-semibold text-primary uppercase tracking-[0.16em]">
                  Transport Naget pod adres
                </p>
                <p className="text-[13px] text-neutral-800">
                  Własny transport z naszego magazynu – minimalizujemy ryzyko
                  uszkodzeń długich elementów. Cena bazowa:{" "}
                  <strong>{formattedDelivery}</strong> (nie jest to ostateczny
                  koszt).
                </p>
                <p className="text-[11px] text-neutral-600">
                  Finalną kwotę transportu obliczamy po weryfikacji trasy,
                  gabarytów i możliwości rozładunku. Potwierdzimy ją przed
                  realizacją.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDelivery((prev) => ({
                    ...prev,
                    method: "pickup",
                    basePrice: 0,
                  }))
                }
                className={`text-left rounded-3xl border p-4 md:p-5 space-y-2 ${
                  delivery.method === "pickup"
                    ? "border-accent bg-accent/5"
                    : "border-border bg-white/60 hover:border-accent/70"
                }`}
              >
                <p className="text-[12px] font-semibold text-primary uppercase tracking-[0.16em]">
                  Odbiór osobisty z magazynu
                </p>
                <p className="text-[13px] text-neutral-800">
                  Możesz odebrać kompletne ogrodzenie własnym transportem z
                  naszego magazynu. Na miejscu pomagamy w zabezpieczeniu
                  ładunku.
                </p>
                <p className="text-[11px] text-neutral-600">
                  Dokładny adres i termin odbioru ustalimy po potwierdzeniu
                  zamówienia.
                </p>
              </button>
            </div>
          </section>
        )}

        {/* KROK 4 – PODSUMOWANIE */}
        {step === 4 && (
          <section className="space-y-6 border-t border-border/60 pt-4">
            <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
              {/* LEWO – produkty + dane */}
              <div className="space-y-3">
                <h2 className="text-[16px] md:text-[18px] font-bold text-primary">
                  Podsumowanie produktów
                </h2>
                <div className="rounded-3xl border border-border bg-white/60 p-4 space-y-2 max-h-[260px] overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 text-[13px] text-neutral-800 border-b border-border/40 last:border-none pb-2 last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        {item.config?.variant === "custom" && (
                          <p className="text-[11px] text-neutral-500">
                            Na wymiar • {item.config.widthMm} mm szer.
                          </p>
                        )}
                        {item.config?.variant === "standard" && (
                          <p className="text-[11px] text-neutral-500">
                            Wysokość: {item.config.heightLabel}
                          </p>
                        )}
                        {item.config?.colorName && (
                          <p className="text-[11px] text-neutral-500">
                            {item.config.colorName}
                          </p>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap text-[12px]">
                        <p>
                          {item.unitPrice.toLocaleString("pl-PL", {
                            style: "currency",
                            currency: "PLN",
                          })}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          × {item.quantity} szt.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <h2 className="text-[16px] md:text-[18px] font-bold text-primary mt-4">
                  Dane zamawiającego
                </h2>
                <div className="rounded-3xl border border-border bg-white/60 p-4 text-[13px] text-neutral-800 space-y-1">
                  <p>
                    <strong>
                      {customer.firstName} {customer.lastName}
                    </strong>{" "}
                    ({customer.type === "b2b" ? "firma" : "osoba prywatna"})
                  </p>
                  {customer.type === "b2b" && (
                    <>
                      <p>{customer.companyName}</p>
                      {customer.nip && <p>NIP: {customer.nip}</p>}
                    </>
                  )}
                  <p>
                    {customer.addressLine1}
                    {customer.addressLine2 && `, ${customer.addressLine2}`}
                  </p>
                  <p>
                    {customer.postalCode} {customer.city},{" "}
                    {customer.country}
                  </p>
                  <p>E-mail: {customer.email}</p>
                  <p>Telefon: {customer.phone}</p>
                </div>
              </div>

              {/* PRAWO – rabat + kwoty + przycisk */}
              <div className="space-y-4">
                <div className="rounded-3xl border border-border bg-white/60 p-4 space-y-3">
                  <h2 className="text-[16px] md:text-[18px] font-bold text-primary">
                    Kod rabatowy
                  </h2>
                  <form
                    onSubmit={handleApplyDiscount}
                    className="flex gap-2 text-[13px]"
                  >
                    <input
                      type="text"
                      value={discount.code}
                      onChange={(e) =>
                        setDiscount((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      placeholder="np. NAGET2025"
                      className="flex-1 rounded-2xl border border-border bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                    <button
                      type="submit"
                      className="rounded-2xl bg-accent text-white text-[11px] font-semibold uppercase tracking-[0.18em] px-4 py-2 hover:bg-accent/90"
                    >
                      Zastosuj
                    </button>
                  </form>
                  {discount.message && (
                    <p className="text-[11px] text-emerald-600">
                      {discount.message}
                    </p>
                  )}
                  {discount.error && (
                    <p className="text-[11px] text-red-600">
                      {discount.error}
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-border bg-white/60 p-4 text-[13px] space-y-2">
                  <div className="flex justify-between">
                    <span>Produkty</span>
                    <span className="font-semibold text-primary">
                      {formattedCartTotal}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Transport (orientacyjnie)
                      {delivery.method === "pickup" && (
                        <span className="text-[11px] text-neutral-500">
                          {" "}
                          – odbiór osobisty
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-primary">
                      {deliveryCost === 0 ? "0,00 zł" : formattedDelivery}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rabat</span>
                    <span className="font-semibold text-primary">
                      -{formattedDiscount}
                    </span>
                  </div>
                  <div className="h-px bg-border/60 my-1" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Razem orientacyjnie
                    </span>
                    <span className="text-[18px] font-extrabold text-primary">
                      {formattedGrandTotal}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Kwoty mają charakter orientacyjny. Wycena wiążąca zostanie
                    przesłana po sprawdzeniu projektu, gabarytów oraz trasy
                    dostawy.
                  </p>
                </div>

                {orderError && (
                  <p className="text-[12px] text-red-600">{orderError}</p>
                )}

                <button
                  type="button"
                  disabled={savingOrder || !items.length}
                  onClick={handlePlaceOrder}
                  className="w-full rounded-2xl bg-accent text-white text-[12px] font-semibold uppercase tracking-[0.18em] py-2 hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingOrder
                    ? "Zapisuję zamówienie..."
                    : "Zapisz zamówienie i przejdź do podziękowania"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* KROK 5 – PODZIĘKOWANIE */}
        {step === 5 && (
          <section className="space-y-4 border-t border-border/60 pt-4">
            <div className="max-w-xl mx-auto rounded-3xl border border-border bg-white/70 p-6 text-center space-y-3 shadow-soft">
              <div className="flex items-center justify-center">
                <FaCheckCircle className="text-accent text-4xl" />
              </div>
              <h2 className="text-[20px] md:text-[22px] font-extrabold text-primary">
                Dziękujemy za złożenie zamówienia!
              </h2>
              <p className="text-[14px] text-neutral-800">
                Twoja konfiguracja została zapisana w naszym systemie. W
                kolejnym kroku przeanalizujemy projekt, zweryfikujemy wymiary
                oraz przygotujemy wiążącą ofertę wraz z dokładnym kosztem
                transportu.
              </p>
              {orderPublicId && (
                <p className="text-[12px] text-neutral-600">
                  Identyfikator zapytania / zamówienia:{" "}
                  <strong className="text-primary">{orderPublicId}</strong>
                </p>
              )}
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={goBackToShop}
                  className="rounded-2xl bg-accent text-white text-[12px] font-semibold uppercase tracking-[0.18em] px-5 py-2 hover:bg-accent/90"
                >
                  Wróć do sklepu
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/konto")}
                  className="rounded-2xl border border-border text-[12px] font-semibold uppercase tracking-[0.18em] px-5 py-2 bg-white/80 text-primary hover:border-accent hover:text-accent"
                >
                  Przejdź do panelu klienta
                </button>
              </div>
            </div>
          </section>
        )}

        {/* NAWIGACJA DÓŁ – tylko dla kroków 2–4 */}
        {step !== 5 && step !== 1 && (
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/60">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 rounded-2xl border text-[11px] uppercase tracking-[0.14em] border-border text-primary hover:border-accent hover:text-accent"
            >
              Wstecz
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={goFromCustomerToDelivery}
                className="btn btn-sm px-6"
              >
                Dalej
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-sm px-6"
              >
                Do podsumowania
              </button>
            )}

            {step === 4 && (
              <span className="text-[11px] text-neutral-500">
                Zapisz zamówienie przyciskiem po prawej.
              </span>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
