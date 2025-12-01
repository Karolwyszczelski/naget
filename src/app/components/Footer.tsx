// src/app/components/Footer.tsx
import Link from "next/link";
import Image from "next/image";
import {
  FaFacebookF,
  FaInstagram,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

const phoneNumbers = [
  "575 968 875",
  "790 668 656",
  "514 396 806",
  "575 551 855",
  "536 992 534",
  "796 714 893",
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border bg-transparent mt-10">

      {/* 3 kolumny: logo / menu / kontakt */}
      <div className="relative container py-10 md:py-14 grid gap-10 md:grid-cols-3 text-primary">
        {/* LEWA KOLUMNA – LOGO + social + link do www */}
        <div className="space-y-5">
          <Image
            src="/logo-naget.png"
            alt="Naget – nowoczesne systemy ogrodzeń"
            width={170}
            height={80}
            priority
          />

          <div className="flex gap-4 pt-1">
            <Link
              href="https://www.facebook.com/nagetogrodzenia"
              aria-label="Naget na Facebooku"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white hover:bg-accentLight transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              <FaFacebookF className="text-[18px]" />
            </Link>
            <Link
              href="https://www.instagram.com/naget_ogrodzenia"
              aria-label="Naget na Instagramie"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white hover:bg-accentLight transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              <FaInstagram className="text-[18px]" />
            </Link>
          </div>

          <p className="pt-3 text-[13px] text-neutral-700">
            <span className="mr-1">Pełna oferta firmy:</span>
            <Link
              href="https://naget.pl"
              className="footer-link font-semibold"
              target="_blank"
              rel="noreferrer"
            >
              www.naget.pl
            </Link>
          </p>
        </div>

        {/* ŚRODKOWA KOLUMNA – MENU SKLEPU */}
        <div className="space-y-4">
          <h3 className="text-[22px] md:text-[26px] font-extrabold uppercase tracking-[0.16em] text-accent">
            Menu
          </h3>

          <ul className="space-y-1 text-[14px] md:text-[15px]">
            <li>
              <Link href="/" className="footer-link text-accent font-semibold">
                Sklep Naget
              </Link>
            </li>
            <li>
              <Link href="/stand-up" className="footer-link">
                Seria Stand Up
              </Link>
            </li>
            <li>
              <Link href="/slab-fence" className="footer-link">
                Seria Slab Fence
              </Link>
            </li>
            <li>
              <Link href="/zadaszenia" className="footer-link">
                Zadaszenia
              </Link>
            </li>
            <li>
              <Link href="/dodatki" className="footer-link">
                Dodatki
              </Link>
            </li>
            <li>
              <Link href="/wyprzedaz" className="footer-link">
                Wyprzedaż
              </Link>
            </li>
            <li>
              <Link href="/kontakt" className="footer-link">
                Kontakt
              </Link>
            </li>
            <li>
              <Link href="/regulamin" className="footer-link">
                Regulamin sklepu
              </Link>
            </li>
            <li>
              <Link href="/polityka-prywatnosci" className="footer-link">
                Polityka prywatności
              </Link>
            </li>
          </ul>
        </div>

        {/* PRAWA KOLUMNA – KONTAKT, TELEFONY JAKO PRZYCISKI */}
        <div className="space-y-4">
          <h3 className="text-[22px] md:text-[26px] font-extrabold uppercase tracking-[0.16em] text-accent">
            Kontakt
          </h3>

          {/* Telefony */}
          <div className="space-y-2">
            {phoneNumbers.map((phone) => (
              <a
                key={phone}
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="btn btn-sm w-full justify-center !text-[12px]"
              >
                <FaPhoneAlt className="mr-2 text-[13px]" />
                {phone}
              </a>
            ))}
          </div>

          {/* E-mail + adres */}
          <div className="pt-3 space-y-2 text-[14px] md:text-[15px]">
            <p className="flex items-center gap-2">
              <FaEnvelope className="text-accent text-[14px]" />
              <a
                href="mailto:ogrodzenia@naget.pl"
                className="footer-link"
              >
                ogrodzenia@naget.pl
              </a>
            </p>
            <p className="flex items-start gap-2">
              <FaMapMarkerAlt className="mt-1 text-accent text-[15px]" />
              <span>
                M. Kasprzaka 20,
                <br />
                06-400 Ciechanów
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Dolny pasek */}
      <div className="relative border-t border-border/60 bg-white/90">
        <div className="container py-3 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] md:text-[12px] text-neutral-600">
          <span>
            © {new Date().getFullYear()} Naget – Nowoczesne systemy ogrodzeń. Wszystkie prawa zastrzeżone.
          </span>
          <span>Sklep internetowy – Nexora Studio dla Naget</span>
        </div>
      </div>
    </footer>
  );
}
