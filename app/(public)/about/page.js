// app/(public)/about/page.js

import Link         from "next/link";
import PagesHero    from "@/components/layout/PagesHero";
import AboutSections from "@/components/sections/AboutSections";

export const metadata = {
  title:       "About Us",
  description: "Learn about Gayatri Home Tutors — our mission, values, and team of verified home tutors serving Delhi NCR since 2010.",
  alternates:  { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PagesHero
        title="About Us"
        subtitle="Empowering students across Delhi NCR with personalised home tuition since 2010"
      />

      <section className="page-sections">
        <div className="section-body" id="about-sections">
          <AboutSections />
        </div>
      </section>

      <section className="pages-cta">
        <div className="left-cta">
          <h2 className="blue-text">Ready to Excel?</h2>
          <h4>Join Thousands of Students Building Strong Foundations for Lifelong Success</h4>
          <p className="cta-text">Experience the difference personalised home tuition can make.</p>
          <span className="book-button">
            <Link href="/contact">Get Started Today!</Link>
          </span>
        </div>
        <div className="right-cta" />
      </section>
    </>
  );
}
