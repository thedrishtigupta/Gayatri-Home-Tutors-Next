// app/not-found.js — the site's 404.
//
// Next.js ships a bare built-in error page that renders outside the public
// layout, so it arrives with no navigation and inherits whatever colour the
// global stylesheet gives it. This replaces it with a branded page that reads
// clearly and, more usefully, offers a way onward.
//
// Header and Footer are imported directly: they live in app/(public)/layout.js,
// and a root not-found renders in the root layout, which does not include them.

import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  { href: "/", label: "Home", note: "Start from the beginning" },
  { href: "/tutors", label: "Find a tutor", note: "Browse by subject, class or area" },
  { href: "/become-tutor", label: "Become a tutor", note: "Apply to teach with us" },
  { href: "/contact", label: "Contact us", note: "Talk to the office" },
];

export default function NotFound() {
  return (
    <>
      <Header />

      <main>
        <section className="nf-hero">
          <div className="nf-inner">
            <p className="nf-code">404</p>
            <h1>This page doesn&apos;t exist</h1>
            <p className="nf-lead">
              The link may be out of date, or the address might have a typo. Everything below still works.
            </p>

            <div className="nf-links">
              {SUGGESTIONS.map(({ href, label, note }) => (
                <Link key={href} href={href} className="nf-link">
                  <strong>{label}</strong>
                  <span>{note}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
