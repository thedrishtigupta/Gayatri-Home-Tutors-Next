// app/(public)/page.js — Home page (SSG)

import HeroSection        from "@/components/sections/HeroSection";
import AboutSections      from "@/components/sections/AboutSections";
import ServicesSections   from "@/components/sections/ServicesSections";
import ContactSections    from "@/components/sections/ContactSections";
import PageSection        from "@/components/sections/PageSection";

export const metadata = {
  title:       "Gayatri Home Tutors | Home Tuition in Delhi NCR",
  description: "Find qualified home tutors in Delhi NCR for all subjects and classes. Personalised tuition since 2010. Book a free demo today!",
  alternates:  { canonical: "/" },
};

// JSON-LD structured data for SEO
function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type":    "LocalBusiness",
    name:       "Gayatri Home Tutors",
    url:        process.env.NEXT_PUBLIC_SITE_URL,
    telephone:  process.env.NEXT_PUBLIC_PHONE,
    address: {
      "@type":           "PostalAddress",
      addressLocality:   "Delhi",
      addressRegion:     "Delhi NCR",
      addressCountry:    "IN",
    },
    description: "Home tuition bureau connecting students with verified tutors across Delhi NCR since 2010.",
    priceRange:  "₹₹",
    openingHours: "Mo-Sa 09:00-20:00",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <HeroSection />

      <PageSection
        id="about-heading"
        title="About Us"
        subtitle="Empowering students across Delhi NCR with personalised home tuition since 2010"
      >
        <AboutSections />
      </PageSection>

      <PageSection
        id="services-heading"
        title="Services"
        subtitle="Comprehensive home tuition services for every academic need"
      >
        <ServicesSections />
      </PageSection>

      <PageSection
        id="contact-heading"
        title="Contact Us"
        subtitle="Book a free demo or reach out with any questions"
      >
        <ContactSections />
      </PageSection>
    </>
  );
}
