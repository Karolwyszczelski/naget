// src/lib/products.ts
import type { SeriesId } from "../app/CartContext";

export type ProductConfigType =
  | "standup-gate"
  | "standup-canopy"
  | "slab-gate"
  | "addons-generic";

export type ProductDefinition = {
  id: string;
  slug: string;
  series: SeriesId;
  path: string; // url w sklepie
  name: string;
  shortName: string;
  lead: string;
  basePrice: number;
  fromPriceLabel: string;
  heroImage: string;
  configType: ProductConfigType;
  seo: {
    title: string;
    description: string;
    h1: string;
  };
};

export const products: ProductDefinition[] = [
  {
    id: "standup-furtka",
    slug: "furtka",
    series: "stand-up",
    path: "/stand-up/furtka",
    name: "Furtka Stand Up",
    shortName: "Furtka Stand Up",
    lead:
      "Furtka aluminiowa z pionowych profili – dostępna w wersji prostej i twist, także na wymiar.",
    basePrice: 3200,
    fromPriceLabel: "od 3 200 zł",
    heroImage: "/products/standup-furtka.jpg", // podmień na swoje zdjęcie
    configType: "standup-gate",
    seo: {
      title: "Furtka aluminiowa Stand Up – konfigurator online | Sklep Naget",
      description:
        "Skonfiguruj furtkę aluminiową Stand Up – wybierz szerokość, wysokość, kierunek otwierania, wypełnienie proste lub twist oraz kolor RAL. Zamów online z dostawą.",
      h1: "Furtka Stand Up – konfigurator",
    },
  },

  // tu później dodasz kolejne produkty, np. brama, slab fence itd.
];

export function getProductById(id: string): ProductDefinition | undefined {
  return products.find((p) => p.id === id);
}
