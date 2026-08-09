// app/(public)/faq/page.js — sitewide FAQ with FAQPage structured data.

import Link from "next/link";
import PagesHero from "@/components/layout/PagesHero";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { FAQ_GROUPS, ALL_FAQS, SITE } from "@/lib/siteData";
import { buildMetadata, faqSchema, breadcrumbSchema, localBusinessSchema } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ — Home Tuition Questions Answered | Gayatri Home Tutors",
  description:
    "Answers to common questions about home tuition in Delhi NCR: fees, tutor verification, free demo classes, subjects, boards, scheduling and tutor applications.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={[
          faqSchema(ALL_FAQS),
          localBusinessSchema(),
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "FAQ", href: "/faq" },
          ]),
        ]}
      />

      <PagesHero
        title="Frequently Asked Questions"
        subtitle="Everything parents and tutors ask us most often"
      />

      <section className="page-sections">
        <div className="seo-wrap">
          <Breadcrumbs trail={[{ name: "Home", href: "/" }, { name: "FAQ", href: "/faq" }]} />

          {FAQ_GROUPS.map((group) => (
            <section className="seo-block" key={group.heading} aria-labelledby={group.heading.replace(/\s+/g, "-").toLowerCase()}>
              <h2 id={group.heading.replace(/\s+/g, "-").toLowerCase()}>{group.heading}</h2>
              <div className="seo-faq">
                {group.items.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section className="seo-final-cta">
            <h2>Still have a question?</h2>
            <p>Call us on {SITE.phoneDisplay} or send your query — we usually reply the same day.</p>
            <div className="seo-cta-row">
              <Link href="/contact" className="seo-btn seo-btn-primary">Contact us</Link>
              <a href={`tel:${SITE.phone}`} className="seo-btn seo-btn-ghost">Call {SITE.phoneDisplay}</a>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
