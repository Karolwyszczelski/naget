// src/app/components/SalesSection.tsx
"use client";

import { FaSlidersH, FaCubes, FaHandshake } from "react-icons/fa";

type SalesSectionProps = {
  /** Ścieżka do pliku wideo w /public */
  videoSrc?: string;
};

export default function SalesSection({
  videoSrc = "/video-naget.mp4", // PODMIEŃ NA SWÓJ PLIK
}: SalesSectionProps) {
  return (
    <section className="section bg-transparent">
      <div className="container max-w-4xl space-y-8">
        {/* BLOK TEKSTOWY POD SEO / SPRZEDAŻ */}
        <div className="text-center md:text-left">
          <h2 className="text-[22px] md:text-[30px] font-extrabold text-accent mb-3 text-center">
            Dlaczego warto zamówić ogrodzenie w sklepie Naget?
          </h2>
          <p className="text-[14px] md:text-[15px] text-neutral-800 mb-2 text-center">
            W Naget łączymy projekt, produkcję i montaż bram, furtek oraz
            ogrodzeń aluminiowych. Serie <strong>Stand Up</strong> i{" "}
            <strong>Slab Fence</strong> konfigurujesz online – w wersji
            standardowej lub na wymiar, z doborem kolorów RAL oraz dodatków.
          </p>
          <p className="text-[14px] md:text-[15px] text-neutral-800 text-center">
            Każdy produkt przygotowujemy pod konkretną inwestycję: od szerokości
            światła bramy, przez wysokość, aż po automatykę i akcesoria.
            Zamawiając w sklepie Naget oszczędzasz czas na wycenach mailowych i
            od razu widzisz orientacyjny koszt kompletu ogrodzenia.
          </p>
        </div>

        {/* 3 KARTY – IKONY NA TLE AKCENTU, WYŚRODKOWANE */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Konfiguracja online */}
          <div className="flex flex-col items-center text-center gap-3 bg-accent text-white rounded-3xl px-6 py-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <FaSlidersH className="text-xl" />
            </div>
            <p className="font-bold text-[15px] md:text-[18px] uppercase text-white">
              Konfiguracja online
            </p>
            <p className="text-[13px] md:text-[14px] text-white/90">
              Wysokości standardowe i „na wymiar”, wybór kierunku otwierania,
              wypełnienia i dodatków – bez wychodzenia z domu.
            </p>
          </div>

          {/* Realne systemy Naget */}
          <div className="flex flex-col items-center text-center gap-3 bg-accent text-white rounded-3xl px-6 py-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <FaCubes className="text-xl" />
            </div>
            <p className="font-bold text-[15px] md:text-[18px] uppercase text-white">
              Realne systemy Naget
            </p>
            <p className="text-[13px] md:text-[14px] text-white/90">
              Te same serie, które montujecie w terenie: Stand Up, Slab Fence
              oraz dedykowane zadaszenia i dodatki.
            </p>
          </div>

          {/* Obsługa B2B i B2C */}
          <div className="flex flex-col items-center text-center gap-3 bg-accent text-white rounded-3xl px-6 py-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <FaHandshake className="text-xl" />
            </div>
            <p className="font-bold text-[15px] md:text-[18px] uppercase text-white">
              Obsługa B2B i B2C
            </p>
            <p className="text-[13px] md:text-[14px] text-white/90">
              Wspieramy klientów indywidualnych, firmy montażowe i biura
              projektowe – od koncepcji po montaż.
            </p>
          </div>
        </div>

        {/* WIDEO – WYŚRODKOWANE + POŚWIATA AKCENTEM */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-3xl">
            {/* Poświata akcentem za wideo */}
            <div className="pointer-events-none absolute -inset-4 rounded-[32px] bg-accent/15 blur-2xl -z-10" />

            <video
              src={videoSrc}
              className="w-full aspect-video rounded-2xl shadow-soft object-cover"
              controls
              playsInline
            />
          </div>
        </div>
      </div>
    </section>
  );
}
