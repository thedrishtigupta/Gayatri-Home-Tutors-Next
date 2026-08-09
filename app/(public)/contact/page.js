// app/(public)/contact/page.js

import PagesHero      from "@/components/layout/PagesHero";
import ContactSections from "@/components/sections/ContactSections";

export const metadata = {
  title:       "Contact Us & Book a Free Demo",
  description: "Get in touch with Gayatri Home Tutors. Book a free demo class or call us directly at +91 85059 52700. Serving all areas across Delhi NCR.",
  alternates:  { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PagesHero
        title="Get in Touch"
        subtitle="Book a free demo or reach out with any questions"
      />
      <section className="page-sections">
        <div className="section-body">
          <ContactSections />
        </div>
      </section>
    </>
  );
}
