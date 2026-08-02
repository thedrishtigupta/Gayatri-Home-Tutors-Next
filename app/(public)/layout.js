// app/(public)/layout.js — shared layout for all public-facing pages

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";

export default function PublicLayout({ children }) {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
