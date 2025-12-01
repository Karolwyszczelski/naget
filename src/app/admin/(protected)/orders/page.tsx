// app/admin/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type OrderStatus = "new" | "in_progress" | "done" | "cancelled";

type OrderSummary = {
  id: string; // public_id
  createdAt: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  itemsCount: number;
  note?: string | null;
};

type OrderItem = {
  id: string;
  productId: string;
  name: string;
  series: string;
  unitPrice: number;
  quantity: number;
  config: any;
};

type OrderDetail = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  currency: string;
  totalAmount: number;
  cartTotal: number;
  deliveryTotal: number;
  discountTotal: number;
  customer: {
    type: string | null;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    nip: string | null;
    email: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
  };
  delivery: {
    method: string | null;
    note: string | null;
  };
  items: OrderItem[];
  internalNote: string | null;
  customerNote: string | null;
};

const statusLabels: Record<OrderStatus, string> = {
  new: "Nowe",
  in_progress: "W realizacji",
  done: "Zrealizowane",
  cancelled: "Anulowane",
};

const statusOptions: { id: OrderStatus; label: string }[] = [
  { id: "new", label: "Nowe" },
  { id: "in_progress", label: "W realizacji" },
  { id: "done", label: "Zrealizowane" },
  { id: "cancelled", label: "Anulowane" },
];

// --- NOWE: helper do ładnego wyświetlania konfiguracji produktu ---
function buildConfigSummary(config: any): string[] {
  if (!config || typeof config !== "object") return [];

  const c = config as Record<string, any>;
  const lines: string[] = [];
  const known = new Set<string>();

  const push = (key: string, label: string) => {
    if (c[key] === undefined || c[key] === null || c[key] === "") return;
    known.add(key);
    lines.push(label);
  };

  // Wymiary
  if (c.widthMm) push("widthMm", `Szerokość: ${c.widthMm} mm`);
  if (c.heightMm) push("heightMm", `Wysokość: ${c.heightMm} mm`);
  if (c.widthCm) push("widthCm", `Szerokość: ${c.widthCm} cm`);
  if (c.heightCm) push("heightCm", `Wysokość: ${c.heightCm} cm`);
  if (c.heightLabel) push("heightLabel", `Wysokość: ${c.heightLabel}`);

  // Profil / rozstaw
  if (c.profileLabel) push("profileLabel", `Profil: ${c.profileLabel}`);
  else if (c.profileId) push("profileId", `Profil: ${c.profileId}`);
  if (c.spacingCm) push("spacingCm", `Rozstaw profili: ok. ${c.spacingCm} cm`);

  // Wypełnienie Stand Up
  if (c.fillType === "prosta") {
    push("fillType", "Wypełnienie: Stand Up Prosty");
  } else if (c.fillType === "twist") {
    push("fillType", "Wypełnienie: Stand Up Twist (efekt żaluzji)");
  }

  // Kolor / struktura
  if (c.colorName) push("colorName", `Kolor: ${c.colorName}`);
  else if (c.colorId) push("colorId", `Kolor: ${c.colorId}`);
  if (c.finishLabel) push("finishLabel", `Struktura: ${c.finishLabel}`);
  else if (c.finishId) push("finishId", `Struktura: ${c.finishId}`);

  // HPL / Slab Fence – wzór płyty, kolory
  if (c.panelPatternName)
    push("panelPatternName", `Wzór płyty: ${c.panelPatternName}`);
  if (c.panelColorName)
    push("panelColorName", `Kolor płyty: ${c.panelColorName}`);
  if (c.frameColorName)
    push("frameColorName", `Kolor ramy: ${c.frameColorName}`);

  // Kierunek, zamek, automatyka itd.
  if (c.openingDirection)
    push("openingDirection", `Kierunek otwierania: ${c.openingDirection}`);
  if (c.lockType) push("lockType", `Zamek: ${c.lockType}`);
  if (c.hasAutomation)
    push("hasAutomation", "Przygotowanie pod automatykę: TAK");
  if (c.hasWicket) push("hasWicket", "Z furtką w świetle bramy");

  // Zadaszenie / dodatki
  if (c.glazingType) push("glazingType", `Szkło / wypełnienie: ${c.glazingType}`);
  if (c.hasLed) push("hasLed", "Oświetlenie LED: TAK");
  if (c.hasMotionSensor)
    push("hasMotionSensor", "Czujnik ruchu: TAK");

  // Materiał
  if (c.material) push("material", `Materiał: ${c.material}`);

  // Fallback – inne proste pola, które nie są obiektami i nie zostały opisane wyżej
  Object.entries(c).forEach(([key, value]) => {
    if (known.has(key)) return;
    if (value === null || value === "" || typeof value === "object") return;

    // trochę czyściejsze etykiety
    const labelKey = key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .toLowerCase();

    lines.push(`${labelKey}: ${String(value)}`);
  });

  return lines;
}

// --------------------------------------------------------------

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [detailsCache, setDetailsCache] = useState<Record<string, OrderDetail>>(
    {}
  );
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<OrderStatus | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [emailMessage, setEmailMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/orders", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error("Nie udało się pobrać zamówień.");
        }

        const data: { orders: OrderSummary[] } = await res.json();
        if (!isMounted) return;
        setOrders(data.orders ?? []);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setOrders([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // filtrowanie + search
  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase().trim();
    return orders.filter((o) => {
      const matchesStatus =
        statusFilter === "all" ? true : o.status === statusFilter;
      const matchesSearch =
        !term ||
        o.id.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const totalAmount = useMemo(
    () => orders.reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );

  const formattedTotalAmount = totalAmount.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });

  // ładowanie szczegółów po kliknięciu w wiersz
  useEffect(() => {
    if (!selectedId) return;

    const existing = detailsCache[selectedId];
    if (existing) {
      setInternalNoteDraft(existing.internalNote ?? "");
      setStatusDraft(existing.status);
      setEmailMessage("");
      setSaveError(null);
      setSaveSuccess(null);
      return;
    }

    let isMounted = true;
    setDetailLoadingId(selectedId);
    setSaveError(null);
    setSaveSuccess(null);

    const loadDetail = async () => {
      try {
        const res = await fetch(
          `/api/admin/orders/${encodeURIComponent(selectedId)}`
        );
        if (!res.ok) {
          throw new Error("Nie udało się pobrać szczegółów zamówienia.");
        }
        const data: { order: OrderDetail } = await res.json();
        if (!isMounted) return;

        setDetailsCache((prev) => ({ ...prev, [selectedId]: data.order }));
        setInternalNoteDraft(data.order.internalNote ?? "");
        setStatusDraft(data.order.status);
        setEmailMessage("");
      } catch (err: any) {
        console.error(err);
        if (!isMounted) return;
        setSaveError(err?.message ?? "Błąd podczas pobierania szczegółów.");
      } finally {
        if (isMounted) setDetailLoadingId(null);
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedId, detailsCache]);

  const selectedDetail = selectedId ? detailsCache[selectedId] : null;

  const handleChangeStatus = (newStatus: OrderStatus) => {
    setStatusDraft(newStatus);
    setSaveSuccess(null);
  };

  const handleSave = async () => {
    if (!selectedId || !selectedDetail || !statusDraft) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(selectedId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: statusDraft,
            internalNote: internalNoteDraft,
            sendEmail,
            emailMessage: emailMessage.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nie udało się zapisać zmian.");
      }

      const data: { status: OrderStatus; internalNote: string | null } =
        await res.json();

      setDetailsCache((prev) => ({
        ...prev,
        [selectedId]: {
          ...selectedDetail,
          status: data.status,
          internalNote: data.internalNote,
        },
      }));

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedId
            ? { ...o, status: data.status, note: data.internalNote }
            : o
        )
      );

      setSaveSuccess(
        sendEmail
          ? "Zapisano zmiany. E-mail do klienta został wysłany (jeśli SMTP jest poprawnie skonfigurowane)."
          : "Zapisano zmiany."
      );
    } catch (err: any) {
      console.error(err);
      setSaveError(err?.message ?? "Błąd podczas zapisywania zmian.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pt-4 md:pt-6">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
          Panel administracyjny · Zamówienia
        </p>
        <h1 className="text-[22px] md:text-[28px] font-extrabold text-accent uppercase">
          Zamówienia online
        </h1>
        <p className="text-[13px] md:text-[14px] text-neutral-700 max-w-2xl">
          Lista zamówień z konfiguratorów. Po lewej wybierasz zamówienie, po
          prawej masz pełne szczegóły, zmianę statusu, wewnętrzne notatki i
          wysyłkę e-maila do klienta.
        </p>
      </header>

      {/* Statystyki górne */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white border border-border p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Liczba zamówień
          </p>
          <p className="mt-1 text-[22px] font-extrabold text-primary">
            {orders.length}
          </p>
        </div>
        <div className="rounded-3xl bg-white border border-border p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Nowe zamówienia
          </p>
          <p className="mt-1 text-[22px] font-extrabold text-primary">
            {orders.filter((o) => o.status === "new").length}
          </p>
        </div>
        <div className="rounded-3xl bg-white border border-border p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Wartość wszystkich zamówień
          </p>
          <p className="mt-1 text-[18px] font-bold text-primary">
            {formattedTotalAmount}
          </p>
        </div>
      </div>

      {/* Filtry + search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-[11px]">
          {[
            { id: "all", label: "Wszystkie" },
            { id: "new", label: "Nowe" },
            { id: "in_progress", label: "W realizacji" },
            { id: "done", label: "Zrealizowane" },
            { id: "cancelled", label: "Anulowane" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id as OrderStatus | "all")}
              className={`px-3 py-1 rounded-full border font-semibold uppercase tracking-[0.14em] ${
                statusFilter === f.id
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-neutral-700 border-border hover:border-accent hover:text-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtruj po ID lub nazwisku..."
            className="w-full md:w-64 rounded-2xl border border-border bg-white/80 px-3 py-1.5 text-[12px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Layout: lista + szczegóły */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2.2fr)] items-start">
        {/* LEWO – tabela */}
        <div className="rounded-3xl border border-border bg-white shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[12px] md:text-[13px]">
              <thead className="bg-neutral-50/80 border-b border-border/60">
                <tr>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">
                    ID
                  </th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">
                    Data
                  </th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">
                    Klient
                  </th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">
                    Pozycje
                  </th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">
                    Kwota
                  </th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 md:px-4 py-6 text-center text-neutral-500"
                    >
                      Ładowanie zamówień...
                    </td>
                  </tr>
                )}

                {!loading && filteredOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 md:px-4 py-6 text-center text-neutral-500"
                    >
                      Brak zamówień dla wybranego filtra.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredOrders.map((order) => {
                    const isSelected = selectedId === order.id;
                    const formattedDate = new Date(
                      order.createdAt
                    ).toLocaleString("pl-PL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    });
                    const formattedAmount = order.totalAmount.toLocaleString(
                      "pl-PL",
                      {
                        style: "currency",
                        currency: "PLN",
                      }
                    );

                    return (
                      <tr
                        key={order.id}
                        onClick={() =>
                          setSelectedId(isSelected ? null : order.id)
                        }
                        className={[
                          "cursor-pointer border-b border-border/40 last:border-b-0",
                          isSelected ? "bg-accent/5" : "hover:bg-neutral-50",
                        ].join(" ")}
                      >
                        <td className="px-3 md:px-4 py-2 align-top text-[11px] text-neutral-500">
                          {order.id}
                        </td>
                        <td className="px-3 md:px-4 py-2 align-top">
                          {formattedDate}
                        </td>
                        <td className="px-3 md:px-4 py-2 align-top">
                          {order.customerName || "–"}
                        </td>
                        <td className="px-3 md:px-4 py-2 align-top">
                          {order.itemsCount} poz.
                        </td>
                        <td className="px-3 md:px-4 py-2 align-top font-semibold text-primary">
                          {formattedAmount}
                        </td>
                        <td className="px-3 md:px-4 py-2 align-top">
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              order.status === "new" &&
                                "bg-emerald-50 text-emerald-700 border border-emerald-200",
                              order.status === "in_progress" &&
                                "bg-amber-50 text-amber-700 border border-amber-200",
                              order.status === "done" &&
                                "bg-sky-50 text-sky-700 border border-sky-200",
                              order.status === "cancelled" &&
                                "bg-neutral-100 text-neutral-600 border border-neutral-300",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {statusLabels[order.status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRAWO – panel szczegółów */}
        <div className="rounded-3xl border border-border bg-white/90 shadow-soft p-4 md:p-5 space-y-4">
          {!selectedId && (
            <p className="text-[13px] text-neutral-600">
              Wybierz zamówienie po lewej stronie, aby zobaczyć szczegóły i
              zarządzać jego statusem.
            </p>
          )}

          {selectedId && (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Zamówienie
                  </p>
                  <p className="text-[17px] font-extrabold text-primary">
                    {selectedId}
                  </p>
                </div>
                {selectedDetail && (
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Status
                    </p>
                    <p className="text-[13px] font-semibold text-primary">
                      {statusLabels[selectedDetail.status]}
                    </p>
                  </div>
                )}
              </div>

              {detailLoadingId === selectedId && (
                <p className="text-[12px] text-neutral-500">
                  Ładowanie szczegółów zamówienia...
                </p>
              )}

              {selectedDetail && detailLoadingId !== selectedId && (
                <>
                  {/* Sekcja klient + adres */}
                  <section className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Dane klienta
                    </p>
                    <div className="grid gap-3 md:grid-cols-2 text-[12px]">
                      <div className="space-y-1">
                        <p className="font-semibold text-primary">
                          {selectedDetail.customer.firstName ||
                          selectedDetail.customer.lastName
                            ? `${selectedDetail.customer.firstName ?? ""} ${
                                selectedDetail.customer.lastName ?? ""
                              }`.trim()
                            : "Klient"}
                        </p>
                        {selectedDetail.customer.companyName && (
                          <p className="text-neutral-700">
                            {selectedDetail.customer.companyName}
                          </p>
                        )}
                        {selectedDetail.customer.nip && (
                          <p className="text-neutral-600">
                            NIP: {selectedDetail.customer.nip}
                          </p>
                        )}
                        {selectedDetail.customer.email && (
                          <p className="text-neutral-700">
                            E-mail: {selectedDetail.customer.email}
                          </p>
                        )}
                        {selectedDetail.customer.phone && (
                          <p className="text-neutral-700">
                            Tel.: {selectedDetail.customer.phone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1 text-[12px] text-neutral-700">
                        <p className="font-semibold text-primary">Adres</p>
                        {selectedDetail.customer.addressLine1 && (
                          <p>{selectedDetail.customer.addressLine1}</p>
                        )}
                        {selectedDetail.customer.addressLine2 && (
                          <p>{selectedDetail.customer.addressLine2}</p>
                        )}
                        {(selectedDetail.customer.postalCode ||
                          selectedDetail.customer.city) && (
                          <p>
                            {selectedDetail.customer.postalCode}{" "}
                            {selectedDetail.customer.city}
                          </p>
                        )}
                        {selectedDetail.customer.country && (
                          <p>{selectedDetail.customer.country}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Dostawa + notatka klienta */}
                  <section className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Dostawa i uwagi klienta
                    </p>
                    <div className="grid gap-3 md:grid-cols-2 text-[12px]">
                      <div className="space-y-1 text-neutral-700">
                        <p className="font-semibold text-primary">
                          Sposób dostawy
                        </p>
                        <p>{selectedDetail.delivery.method || "—"}</p>
                      </div>
                      <div className="space-y-1 text-neutral-700">
                        <p className="font-semibold text-primary">
                          Uwagi do dostawy / konfiguracji
                        </p>
                        <p className="whitespace-pre-wrap">
                          {selectedDetail.delivery.note ||
                            selectedDetail.customerNote ||
                            "Brak dodatkowych uwag."}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Pozycje */}
                  <section className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Pozycje w zamówieniu
                    </p>
                    <div className="rounded-2xl border border-border/60 bg-neutral-50/70 max-h-64 overflow-auto">
                      <table className="min-w-full text-[12px]">
                        <thead className="bg-neutral-100/80 border-b border-border/60">
                          <tr>
                            <th className="px-3 py-1 text-left font-semibold text-neutral-600">
                              Produkt
                            </th>
                            <th className="px-3 py-1 text-left font-semibold text-neutral-600">
                              Ilość
                            </th>
                            <th className="px-3 py-1 text-left font-semibold text-neutral-600">
                              Cena
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDetail.items.map((item) => {
                            const cfgLines = buildConfigSummary(item.config);

                            return (
                              <tr
                                key={item.id}
                                className="border-b border-border/40 last:border-b-0"
                              >
                                <td className="px-3 py-1 align-top">
                                  <p className="font-semibold text-primary">
                                    {item.name}
                                  </p>
                                  <p className="text-[11px] text-neutral-600">
                                    {item.series}
                                  </p>

                                  {cfgLines.length > 0 && (
                                    <ul className="mt-1 space-y-0.5 text-[11px] text-neutral-700">
                                      {cfgLines.map((line, idx) => (
                                        <li key={idx}>• {line}</li>
                                      ))}
                                    </ul>
                                  )}

                                  {item.config && (
                                    <details className="mt-1 text-[10px] text-neutral-500">
                                      <summary className="cursor-pointer select-none">
                                        Pokaż surową konfigurację
                                      </summary>
                                      <pre className="mt-1 whitespace-pre-wrap break-all bg-white/60 rounded-xl p-2 border border-border/60">
                                        {JSON.stringify(
                                          item.config,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </details>
                                  )}
                                </td>
                                <td className="px-3 py-1 align-top">
                                  {item.quantity} szt.
                                </td>
                                <td className="px-3 py-1 align-top">
                                  {item.unitPrice.toLocaleString("pl-PL", {
                                    style: "currency",
                                    currency: selectedDetail.currency,
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Podsumowanie kwot */}
                  <section className="space-y-1 text-[12px] text-neutral-700">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Podsumowanie
                    </p>
                    <div className="flex flex-col gap-1">
                      <p>
                        Wartość produktów:{" "}
                        <strong className="text-primary">
                          {selectedDetail.cartTotal.toLocaleString("pl-PL", {
                            style: "currency",
                            currency: selectedDetail.currency,
                          })}
                        </strong>
                      </p>
                      <p>
                        Dostawa:{" "}
                        <strong className="text-primary">
                          {selectedDetail.deliveryTotal.toLocaleString(
                            "pl-PL",
                            {
                              style: "currency",
                              currency: selectedDetail.currency,
                            }
                          )}
                        </strong>
                      </p>
                      {selectedDetail.discountTotal > 0 && (
                        <p>
                          Rabat:{" "}
                          <strong className="text-primary">
                            -
                            {selectedDetail.discountTotal.toLocaleString(
                              "pl-PL",
                              {
                                style: "currency",
                                currency: selectedDetail.currency,
                              }
                            )}
                          </strong>
                        </p>
                      )}
                      <p className="mt-1 text-[13px]">
                        Razem:{" "}
                        <strong className="text-primary text-[16px]">
                          {selectedDetail.totalAmount.toLocaleString("pl-PL", {
                            style: "currency",
                            currency: selectedDetail.currency,
                          })}
                        </strong>
                      </p>
                    </div>
                  </section>

                  {/* Status + notatka + e-mail */}
                  <section className="space-y-3 border-t border-border/60 pt-3">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                        Status zamówienia
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {statusOptions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleChangeStatus(s.id)}
                            className={`px-3 py-1 rounded-full border font-semibold uppercase tracking-[0.14em] ${
                              statusDraft === s.id
                                ? "bg-accent text-white border-accent"
                                : "bg-white text-neutral-700 border-border hover:border-accent hover:text-accent"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                        Wewnętrzna notatka (niewidoczna dla klienta)
                      </p>
                      <textarea
                        rows={3}
                        value={internalNoteDraft}
                        onChange={(e) =>
                          setInternalNoteDraft(e.target.value)
                        }
                        className="w-full rounded-2xl border border-border bg-white/80 px-3 py-2 text-[12px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        placeholder="Np. ustalony inny termin montażu, kontakt telefoniczny, uwagi dla księgowości..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[12px] text-neutral-700">
                        <input
                          type="checkbox"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                          className="h-4 w-4 rounded border-border text-accent"
                        />
                        <span>
                          Wyślij e-mail do klienta o zmianie statusu
                        </span>
                      </label>

                      {sendEmail && (
                        <textarea
                          rows={3}
                          value={emailMessage}
                          onChange={(e) =>
                            setEmailMessage(e.target.value)
                          }
                          className="w-full rounded-2xl border border-border bg-white/80 px-3 py-2 text-[12px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                          placeholder="Dodatkowa wiadomość do klienta (opcjonalna). Podstawowa informacja o statusie i kwocie zamówienia jest generowana automatycznie."
                        />
                      )}
                    </div>

                    {saveError && (
                      <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
                        {saveError}
                      </p>
                    )}

                    {saveSuccess && (
                      <p className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2">
                        {saveSuccess}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !statusDraft}
                        className="px-5 py-2 rounded-2xl bg-accent text-white text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-accent/90 disabled:opacity-60"
                      >
                        {saving ? "Zapisywanie..." : "Zapisz zmiany"}
                      </button>
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
