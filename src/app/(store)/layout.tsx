// app/(store)/layout.tsx
import "../globals.css";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: "Sklep Naget",
  description: "Nowoczesne bramy, furtki i zadaszenia Naget.",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Ten Navbar korzysta już z globalnego CartProvider z app/layout.tsx */}
      <Navbar />
      <main className="main">{children}</main>
      <Footer />
    </>
  );
}
