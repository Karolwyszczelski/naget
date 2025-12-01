// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./CartContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Naget",
  description: "Konfiguratory bram i ogrodzeń Naget",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        {/* JEDEN globalny koszyk dla całej aplikacji */}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
