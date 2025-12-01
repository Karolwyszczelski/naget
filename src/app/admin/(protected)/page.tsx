// app/admin/page.tsx
import Link from "next/link";
import {
  FaShoppingBag,
  FaBoxOpen,
  FaCogs,
  FaChartLine,
  FaExternalLinkAlt,
  FaFileDownload,
  FaUserShield,
  FaArrowRight,
} from "react-icons/fa";

export default function AdminHomePage() {
  return (
    <div className="space-y-8 pt-4 md:pt-6">
      {/* NAGŁÓWEK / HERO DASHBOARDU */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
            Panel administracyjny
          </p>
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-accent uppercase">
            Dashboard
          </h1>
          <p className="text-[13px] md:text-[14px] text-neutral-700 max-w-xl">
            Szybki podgląd tego, co dzieje się w sklepie Naget. Stąd
            przejdziesz do zamówień, produktów i ustawień technicznych.
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-r from-accent to-indigo-600 text-white px-5 py-4 text-[12px] md:text-[13px] shadow-soft max-w-sm">
          <p className="uppercase tracking-[0.18em] text-[10px] opacity-80">
            SZYBKI START
          </p>
          <p className="mt-1 font-semibold">
            1. Sprawdź nowe zamówienia · 2. Oznacz status · 3. Wyślij ofertę lub
            potwierdzenie do klienta.
          </p>
          <p className="mt-2 opacity-80">
            W razie wątpliwości – wszelkie szczegóły konfiguracji znajdziesz po
            kliknięciu w konkretne zamówienie.
          </p>
        </div>
      </header>

      {/* GŁÓWNE MODUŁY PANELU */}
      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Moduły panelu
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {/* ZAMÓWIENIA */}
          <Link
            href="/admin/orders"
            className="group rounded-3xl bg-white border border-border p-4 shadow-soft hover:border-accent hover:shadow-[0_18px_45px_rgba(62,82,164,0.16)] transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                  <FaShoppingBag className="text-[18px]" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    Moduł
                  </p>
                  <p className="text-[16px] font-bold text-primary">
                    Zamówienia online
                  </p>
                </div>
              </div>
              <FaArrowRight className="text-neutral-400 group-hover:text-accent transition-colors" />
            </div>
            <p className="mt-3 text-[13px] text-neutral-700">
              Lista zamówień z konfiguratorów Stand Up, Slab Fence i dodatków.
              Możesz filtrować po statusie i oznaczać zamówienia jako{" "}
              <strong>Nowe</strong>, <strong>W realizacji</strong> lub{" "}
              <strong>Zrealizowane</strong>.
            </p>
          </Link>

          {/* PRODUKTY – NA PRZYSZŁOŚĆ */}
          <div className="rounded-3xl bg-white border border-dashed border-border p-4 shadow-soft opacity-80">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center">
                <FaBoxOpen className="text-[18px]" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Moduł (w przygotowaniu)
                </p>
                <p className="text-[16px] font-bold text-neutral-700">
                  Katalog produktów
                </p>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-neutral-700">
              Centralne miejsce do zarządzania konfiguratorami, cenami bazowymi
              i opisami. Docelowo tu będą edytowane parametry serii
              <strong> Stand Up</strong>, <strong>Slab Fence</strong> i{" "}
              <strong>dodatków</strong>.
            </p>
          </div>

          {/* USTAWIENIA / TECH */}
          <div className="rounded-3xl bg-white border border-border p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <FaCogs className="text-[18px]" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Moduł techniczny
                </p>
                <p className="text-[16px] font-bold text-primary">
                  Ustawienia i integracje
                </p>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-neutral-700">
              Miejsce na konfigurację integracji z Supabase, Przelewy24,
              powiadomieniami e-mail/SMS oraz trybem testowym sklepu.
            </p>
          </div>
        </div>
      </section>

      {/* SZYBKIE AKCJE */}
      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Szybkie akcje
        </h2>

        <div className="grid gap-4 md:grid-cols-4 text-[13px]">
          <Link
            href="/admin/orders?tab=new"
            className="rounded-3xl bg-white border border-border p-4 shadow-soft hover:border-accent hover:shadow-[0_12px_30px_rgba(62,82,164,0.18)] transition-all"
          >
            <p className="font-semibold text-primary">
              Otwórz nowe zamówienia
            </p>
            <p className="mt-1 text-neutral-700">
              Lista zamówień ze statusem <strong>Nowe</strong> – do
              przejrzenia i kontaktu z klientem.
            </p>
          </Link>

          <Link
            href="/admin/orders?tab=in-progress"
            className="rounded-3xl bg-white border border-border p-4 shadow-soft hover:border-accent hover:shadow-[0_12px_30px_rgba(62,82,164,0.18)] transition-all"
          >
            <p className="font-semibold text-primary">Zamówienia w realizacji</p>
            <p className="mt-1 text-neutral-700">
              Szybki podgląd konfiguracji, które są już na etapie produkcji lub
              montażu.
            </p>
          </Link>

          <button
            type="button"
            className="text-left rounded-3xl bg-white border border-border p-4 shadow-soft hover:border-accent hover:shadow-[0_12px_30px_rgba(62,82,164,0.18)] transition-all"
          >
            <div className="flex items-center gap-2">
              <FaFileDownload className="text-accent" />
              <p className="font-semibold text-primary">
                Eksport zamówień (CSV)
              </p>
            </div>
            <p className="mt-1 text-neutral-700">
              Miejsce na przycisk eksportu danych z Supabase do raportów
              księgowych lub produkcyjnych.
            </p>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl bg-slate-900 text-white border border-slate-800 p-4 shadow-soft hover:border-accent hover:bg-accent transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-2">
              <FaExternalLinkAlt className="text-[14px]" />
              <p className="font-semibold text-[13px] text-white">
                Otwórz sklep jak klient
              </p>
            </div>
            <p className="mt-1 text-[12px] opacity-80 text-white">
              Podgląd konfiguratorów w trybie klienta w nowej karcie.
            </p>
          </a>
        </div>
      </section>

      {/* BLOK INFORMACYJNY – BEZPIECZEŃSTWO I ORGANIZACJA PRACY */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
        <div className="rounded-3xl bg-white border border-border p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <FaChartLine className="text-[18px]" />
            </div>
            <h2 className="text-[16px] md:text-[18px] font-bold text-primary uppercase">
              Jak pracować z zamówieniami?
            </h2>
          </div>

          <ol className="mt-1 space-y-1 text-[13px] text-neutral-700 list-decimal list-inside">
            <li>
              Wejdź w <strong>Zamówienia online</strong> i przejdź na zakładkę{" "}
              <strong>Nowe</strong>.
            </li>
            <li>
              Po kliknięciu w wiersz otwórz szczegóły konfiguracji – zwróć
              uwagę na <strong>wymiary</strong>, <strong>kolor</strong> i{" "}
              <strong>uwagi klienta</strong>.
            </li>
            <li>
              Przygotuj wycenę / ofertę na podstawie konfiguracji i wyślij ją do
              klienta z systemu CRM / poczty.
            </li>
            <li>
              Zmień status na <strong>W realizacji</strong>, gdy zamówienie
              trafia do produkcji lub montażu.
            </li>
            <li>
              Po zakończeniu – zaznacz <strong>Zrealizowane</strong>, aby mieć
              czyty pipeline zamówień.
            </li>
          </ol>
        </div>

        <div className="rounded-3xl bg-slate-900 text-white border border-slate-800 p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center">
              <FaUserShield className="text-[18px]" />
            </div>
            <h2 className="text-[16px] md:text-[18px] font-bold uppercase text-white">
              Bezpieczeństwo panelu
            </h2>
          </div>

          <ul className="space-y-1 text-[13px] text-white/85 list-disc list-inside">
            <li>
              Dostęp do panelu mają tylko konta z tabeli{" "}
              <code className="px-1 py-0.5 rounded bg-slate-800 text-[11px]">
                admin_users
              </code>{" "}
              w Supabase.
            </li>
            <li>
              W razie potrzeby możesz dodać kolejne konto administracyjne, ale
              tylko z zaufanego adresu e-mail.
            </li>
            <li>
              Sesja logowania jest obsługiwana przez Supabase Auth – po
              wylogowaniu dostęp do <code>/admin</code> jest blokowany.
            </li>
            <li>
              Upewnij się, że hasło do konta admina jest unikalne i nie jest
              używane w innych serwisach.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
