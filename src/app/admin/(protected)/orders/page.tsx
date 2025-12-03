// app/admin/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

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

// --- helper do ładnego wyświetlania konfiguracji produktu ---
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

  if (c.widthMm) push("widthMm", `Szerokość: ${c.widthMm} mm`);
  if (c.heightMm) push("heightMm", `Wysokość: ${c.heightMm} mm`);
  if (c.widthCm) push("widthCm", `Szerokość: ${c.widthCm} cm`);
  if (c.heightCm) push("heightCm", `Wysokość: ${c.heightCm} cm`);
  if (c.heightLabel) push("heightLabel", `Wysokość: ${c.heightLabel}`);

  if (c.profileLabel) push("profileLabel", `Profil: ${c.profileLabel}`);
  else if (c.profileId) push("profileId", `Profil: ${c.profileId}`);
  if (c.spacingCm) push("spacingCm", `Rozstaw profili: ok. ${c.spacingCm} cm`);

  if (c.fillType === "prosta") push("fillType", "Wypełnienie: Stand Up Prosty");
  else if (c.fillType === "twist") push("fillType", "Wypełnienie: Stand Up Twist (efekt żaluzji)");

  if (c.colorName) push("colorName", `Kolor: ${c.colorName}`);
  else if (c.colorId) push("colorId", `Kolor: ${c.colorId}`);
  if (c.finishLabel) push("finishLabel", `Struktura: ${c.finishLabel}`);
  else if (c.finishId) push("finishId", `Struktura: ${c.finishId}`);

  if (c.panelPatternName) push("panelPatternName", `Wzór płyty: ${c.panelPatternName}`);
  if (c.panelColorName) push("panelColorName", `Kolor płyty: ${c.panelColorName}`);
  if (c.frameColorName) push("frameColorName", `Kolor ramy: ${c.frameColorName}`);

  if (c.openingDirection) push("openingDirection", `Kierunek otwierania: ${c.openingDirection}`);
  if (c.lockType) push("lockType", `Zamek: ${c.lockType}`);
  if (c.hasAutomation) push("hasAutomation", "Przygotowanie pod automatykę: TAK");
  if (c.hasWicket) push("hasWicket", "Z furtką w świetle bramy");

  if (c.glazingType) push("glazingType", `Szkło / wypełnienie: ${c.glazingType}`);
  if (c.hasLed) push("hasLed", "Oświetlenie LED: TAK");
  if (c.hasMotionSensor) push("hasMotionSensor", "Czujnik ruchu: TAK");

  if (c.material) push("material", `Materiał: ${c.material}`);

  Object.entries(c).forEach(([key, value]) => {
    if (known.has(key)) return;
    if (value === null || value === "" || typeof value === "object") return;

    const labelKey = key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .toLowerCase();

    lines.push(`${labelKey}: ${String(value)}`);
  });

  return lines;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [detailsCache, setDetailsCache] = useState<Record<string, OrderDetail>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<OrderStatus | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [emailMessage, setEmailMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const router = useRouter();

  const adminFetch = async (input: RequestInfo, init: RequestInit = {}) => {
    const { data } = await supabaseClient.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      router.replace("/admin/login");
      throw new Error("NO_SESSION");
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");

    return fetch(input, { ...init, headers });
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      setLoading(true);
      setSaveError(null);

      try {
        const res = await adminFetch("/api/admin/orders", { method: "GET" });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (res.status === 403) {
          setSaveError("Brak uprawnień admina (admin_users).");
          return;
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase().trim();
    return orders.filter((o) => {
      const matchesStatus = statusFilter === "all" ? true : o.status === statusFilter;
      const matchesSearch =
        !term || o.id.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const totalAmount = useMemo(() => orders.reduce((sum, o) => sum + o.totalAmount, 0), [orders]);

  const formattedTotalAmount = totalAmount.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });

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
        const res = await adminFetch(`/api/admin/orders/${encodeURIComponent(selectedId)}`);

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (res.status === 403) {
          setSaveError("Brak uprawnień admina (admin_users).");
          return;
        }

        if (!res.ok) throw new Error("Nie udało się pobrać szczegółów zamówienia.");

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
  }, [selectedId, detailsCache, router]);

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
      const res = await adminFetch(`/api/admin/orders/${encodeURIComponent(selectedId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusDraft,
          internalNote: internalNoteDraft,
          sendEmail,
          emailMessage: emailMessage.trim() || undefined,
        }),
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (res.status === 403) {
        throw new Error("Brak uprawnień admina (admin_users).");
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nie udało się zapisać zmian.");
      }

      const data: { status: OrderStatus; internalNote: string | null } = await res.json();

      setDetailsCache((prev) => ({
        ...prev,
        [selectedId]: {
          ...selectedDetail,
          status: data.status,
          internalNote: data.internalNote,
        },
      }));

      setOrders((prev) =>
        prev.map((o) => (o.id === selectedId ? { ...o, status: data.status, note: data.internalNote } : o))
      );

      setSaveSuccess(sendEmail ? "Zapisano zmiany (wysyłka e-maila zależy od konfiguracji SMTP)." : "Zapisano zmiany.");
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
          Lista zamówień z konfiguratorów. Po lewej wybierasz zamówienie, po prawej masz pełne szczegóły,
          zmianę statusu, wewnętrzne notatki i wysyłkę e-maila do klienta.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white border border-border p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">Liczba zamówień</p>
          <p className="mt-1 text-[22px] font-extrabold text-primary">{orders.length}</p>
        </div>
        <div className="rounded-3xl bg-white border border-border p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">Nowe zamówienia</p>
          <p className="mt-1 text-[22px] font-extrabold text-primary">{orders.filter((o) => o.status === "new").length}</p>
        </div>
        <div className="rounded-3xl bg-white border border-border p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">Wartość wszystkich zamówień</p>
          <p className="mt-1 text-[18px] font-bold text-primary">{formattedTotalAmount}</p>
        </div>
      </div>

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

      {saveError && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
          {saveError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2.2fr)] items-start">
        <div className="rounded-3xl border border-border bg-white shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[12px] md:text-[13px]">
              <thead className="bg-neutral-50/80 border-b border-border/60">
                <tr>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">ID</th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">Data</th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">Klient</th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">Pozycje</th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">Kwota</th>
                  <th className="px-3 md:px-4 py-2 font-semibold text-neutral-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-3 md:px-4 py-6 text-center text-neutral-500">
                      Ładowanie zamówień...
                    </td>
                  </tr>
                )}

                {!loading && filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 md:px-4 py-6 text-center text-neutral-500">
                      Brak zamówień dla wybranego filtra.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredOrders.map((order) => {
                    const isSelected = selectedId === order.id;
                    const formattedDate = new Date(order.createdAt).toLocaleString("pl-PL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    });
                    const formattedAmount = order.totalAmount.toLocaleString("pl-PL", {
                      style: "currency",
                      currency: "PLN",
                    });

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedId(isSelected ? null : order.id)}
                        className={[
                          "cursor-pointer border-b border-border/40 last:border-b-0",
                          isSelected ? "bg-accent/5" : "hover:bg-neutral-50",
                        ].join(" ")}
                      >
                        <td className="px-3 md:px-4 py-2 align-top text-[11px] text-neutral-500">{order.id}</td>
                        <td className="px-3 md:px-4 py-2 align-top">{formattedDate}</td>
                        <td className="px-3 md:px-4 py-2 align-top">{order.customerName || "–"}</td>
                        <td className="px-3 md:px-4 py-2 align-top">{order.itemsCount} poz.</td>
                        <td className="px-3 md:px-4 py-2 align-top font-semibold text-primary">{formattedAmount}</td>
                        <td className="px-3 md:px-4 py-2 align-top">
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              order.status === "new" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                              order.status === "in_progress" && "bg-amber-50 text-amber-700 border border-amber-200",
                              order.status === "done" && "bg-sky-50 text-sky-700 border border-sky-200",
                              order.status === "cancelled" && "bg-neutral-100 text-neutral-600 border border-neutral-300",
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

        <div className="rounded-3xl border border-border bg-white/90 shadow-soft p-4 md:p-5 space-y-4">
          {!selectedId && (
            <p className="text-[13px] text-neutral-600">
              Wybierz zamówienie po lewej stronie, aby zobaczyć szczegóły i zarządzać jego statusem.
            </p>
          )}

          {selectedId && (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Zamówienie</p>
                  <p className="text-[17px] font-extrabold text-primary">{selectedId}</p>
                </div>
                {selectedDetail && (
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Status</p>
                    <p className="text-[13px] font-semibold text-primary">{statusLabels[selectedDetail.status]}</p>
                  </div>
                )}
              </div>

              {detailLoadingId === selectedId && (
                <p className="text-[12px] text-neutral-500">Ładowanie szczegółów zamówienia...</p>
              )}

              {selectedDetail && detailLoadingId !== selectedId && (
                <>
                  {/* reszta Twojego JSX (klient, dostawa, pozycje, podsumowanie, status, notatka, email) zostaje bez zmian */}
                  {/* ... */}
                  {/* W tym miejscu wklej swój niezmieniony blok JSX od "Dane klienta" w dół */}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* UWAGA: Żeby nie dublować setek linii, wklej w miejscu wskazanym wyżej swój istniejący JSX od "Dane klienta" do końca komponentu.
          Logika została naprawiona na poziomie fetch/sesji i to jest źródło Twoich błędów. */}
    </div>
  );
}
