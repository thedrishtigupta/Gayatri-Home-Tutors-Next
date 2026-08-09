// app/(public)/terms/page.js

import PagesHero   from "@/components/layout/PagesHero";
import TermsAccordion from "@/components/sections/TermsAccordion";

export const metadata = {
  title:       "Terms & Conditions",
  description: "Read the Gayatri Home Tutors Terms and Conditions for tutors and students. Commission plans, demo class policy, payment process and more.",
  alternates:  { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PagesHero
        title="Terms and Conditions"
        subtitle="Applicable With Effect From 20 Jan, 2022"
      />
      <section className="terms-container">
        <TermsAccordion />
      </section>
    </>
  );
}
