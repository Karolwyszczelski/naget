"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Slide = {
  id: string;
  label: string;
  title: string;
  description: string;
  image: string;
  align: "left" | "right";
};

const slides: Slide[] = [
  {
    id: "stand-up",
    label: "SERIA",
    title: "STAND UP",
    description:
      "Nowoczesne furtki i bramy z pionowych profili – dopasowane do ogrodzeń panelowych.",
    image: "/sliders/hero-stand.jpg",
    align: "left",
  },
  {
    id: "slab-fence",
    label: "SERIA",
    title: "SLAB FENCE",
    description:
      "Pełne zabudowy z poziomych paneli – więcej prywatności i ochrona przed wiatrem.",
    image: "/sliders/hero-slab.jpg",
    align: "right",
  },
  {
    id: "addons",
    label: "DODATKI",
    title: "DODATKI",
    description:
      "Automatyka, zamki, akcesoria montażowe – wszystko, czego potrzebujesz do kompletnego ogrodzenia.",
    image: "/sliders/hero-add.jpg",
    align: "right",
  },
];

export default function HeroSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setActive((prev) => (prev + 1) % slides.length),
      8000
    );
    return () => clearInterval(timer);
  }, []);

  const current = slides[active];
  const isLeft = current.align === "left";

  return (
    <section className="relative min-h-[340px] py-4 md:py-6">
      {/* TŁO – obraz na całą sekcję */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={index !== active}
        >
          <Image
            src={slide.image}
            alt={`${slide.label} ${slide.title} – ogrodzenia Naget`}
            fill
            priority={index === 0}
            className="object-cover object-center"
          />
        </div>
      ))}

      {/* BLOK TEKST + PRZYCISK */}
      <div className="relative z-10 min-h-[360px] flex items-center">
        <div className="container px-6 md:px-12">
          <div
            className={`max-w-xl space-y-3 flex flex-col ${
              isLeft
                ? "items-start text-left"
                : "items-end text-right ml-auto"
            }`}
          >
            {/* Seria / Dodatki */}
            <p className="text-white text-sm md:text-base font-semibold uppercase tracking-[0.24em] drop-shadow">
              {current.label}
            </p>

            {/* Tytuł – zawsze gradient jak w „DODATKI” */}
            <h2 className="text-[28px] md:text-[34px] font-extrabold bg-gradient-to-r from-white to-accent bg-clip-text text-transparent drop-shadow-lg">
              {current.title}
            </h2>

            {/* Opis */}
            <p className="text-white text-[14px] md:text-[16px] max-w-lg drop-shadow">
              {current.description}
            </p>

            {/* Przycisk */}
            <div className={isLeft ? "self-start" : "self-end"}>
              {current.id === "stand-up" && (
                <Link
                  href={{ pathname: "/", hash: "seria-stand-up" }}
                  className="btn"
                >
                  Konfiguruj serię Stand Up
                </Link>
              )}
              {current.id === "slab-fence" && (
                <Link
                  href={{ pathname: "/", hash: "seria-slab-fence" }}
                  className="btn"
                >
                  Konfiguruj serię Slab Fence
                </Link>
              )}
              {current.id === "addons" && (
                <Link href="/dodatki" className="btn">
                  Zobacz dodatki do ogrodzeń
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kropki nawigacji slidera */}
      <div className="relative z-20 flex items-center justify-center gap-2 pb-3">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActive(index)}
            className={`h-2 rounded-full transition-all ${
              index === active ? "w-6 bg-accent" : "w-3 bg-white/70"
            }`}
            aria-label={`Pokaż slajd: ${slide.label} ${slide.title}`}
          />
        ))}
      </div>
    </section>
  );
}
