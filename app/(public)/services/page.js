// app/(public)/services/page.js

import Link             from "next/link";
import PagesHero        from "@/components/layout/PagesHero";
import ServicesSections from "@/components/sections/ServicesSections";

export const metadata = {
  title:       "Services",
  description: "Home tuition services by Gayatri Home Tutors — Maths, Science, English, Commerce and more for Class 1 to 12 and beyond across Delhi NCR.",
  alternates:  { canonical: "/services" },
};

const REASONS = [
  "One-on-one personalised attention",
  "Flexible scheduling at your convenience",
  "Regular assessments and progress tracking",
  "Personalised study plans",
  "Experienced and verified tutors",
  "Affordable and transparent pricing",
];

export default function ServicesPage() {
  return (
    <>
      <PagesHero
        title="Services"
        subtitle="Comprehensive home tuition services for every academic need"
      />

      <section className="page-sections">
        <div className="section-body">
          <ServicesSections />
        </div>
      </section>

      <section className="pages-cta">
        <div className="left-cta">
          <h2 className="blue-text">Why choose us?</h2>
          <p className="cta-text" id="services-p">
            We understand that every student is unique. Our personalised approach ensures that each child
            gets the attention and support they need to excel.
          </p>
          <div className="cta-choose-grid">
            {REASONS.map(text => (
              <div className="cta-choose-grid-els" key={text}>
                <div className="grid-icon">
                  <img src="/assets/images/checkmark-yellow.png" alt="check" width={16} height={16} />
                </div>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="right-cta">
          <div id="services-right-cta">
            <div className="right-upper-cta-text">
              <h3>Ready to get started?</h3>
              <p>Book a free demo class today</p>
            </div>
            <div className="right-mid-cta-btn">
              <Link href="/contact"      id="services-cta-btn1" className="cta-btn">Book Free Demo</Link>
              <Link href="/become-tutor" id="services-cta-btn2" className="cta-btn">Find a Tutor</Link>
            </div>
            <div className="right-lower-cta-text">
              <p>Or call us directly at</p>
              <a href="tel:+918505952700" id="right-cta-contact-number" className="blue-text">+91 85059 52700</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
