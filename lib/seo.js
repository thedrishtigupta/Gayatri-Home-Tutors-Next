// lib/seo.js — shared metadata + structured-data builders.
import { SITE } from "./siteData";

/** Build a Next.js Metadata object with canonical + Open Graph + Twitter. */
export function buildMetadata({ title, description, path = "/", image, type = "website" }) {
  const url = path.startsWith("http") ? path : `${SITE.url}${path}`;
  const img = image || SITE.ogImage;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "en_IN",
      url,
      siteName: SITE.name,
      title,
      description,
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [img],
    },
    robots: { index: true, follow: true },
  };
}

export function localBusinessSchema({ areaServed } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE.url}#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}${SITE.logo}`,
    image: `${SITE.url}${SITE.ogImage}`,
    telephone: SITE.phone,
    email: SITE.email,
    foundingDate: SITE.founded,
    priceRange: SITE.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.street,
      addressLocality: SITE.locality,
      addressRegion: SITE.region,
      postalCode: SITE.postalCode,
      addressCountry: SITE.country,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "20:00",
      },
    ],
    areaServed: (areaServed && areaServed.length ? areaServed : ["Delhi", "Noida", "Gurgaon", "Ghaziabad", "Faridabad"]).map(
      (name) => ({ "@type": "Place", name }),
    ),
    sameAs: [],
  };
}

export function breadcrumbSchema(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.href}`,
    })),
  };
}

export function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function serviceSchema({ name, description, areaServed, path }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType: "Home tuition",
    provider: { "@id": `${SITE.url}#organization` },
    areaServed: (areaServed || ["Delhi NCR"]).map((a) => ({ "@type": "Place", name: a })),
    url: `${SITE.url}${path}`,
  };
}
