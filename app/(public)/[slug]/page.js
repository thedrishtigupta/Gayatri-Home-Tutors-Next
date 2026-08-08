// app/(public)/[slug]/page.js
// Statically generated SEO landing pages (locality + topic).
// Slugs come from lib/siteData.js; unknown slugs 404 (dynamicParams = false).

import { notFound } from "next/navigation";
import LandingSection from "@/components/seo/LandingSection";
import JsonLd from "@/components/seo/JsonLd";
import { AREA_PAGES, TOPIC_PAGES, SITE } from "@/lib/siteData";
import {
  buildMetadata,
  localBusinessSchema,
  breadcrumbSchema,
  faqSchema,
  serviceSchema,
} from "@/lib/seo";

export const dynamicParams = false;
export const revalidate = 86400;

function findPage(slug) {
  const area = AREA_PAGES.find((p) => p.slug === slug);
  if (area) return { page: area, kind: "area" };
  const topic = TOPIC_PAGES.find((p) => p.slug === slug);
  if (topic) return { page: topic, kind: "topic" };
  return null;
}

export function generateStaticParams() {
  return [...AREA_PAGES, ...TOPIC_PAGES].map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const found = findPage(params.slug);
  if (!found) return {};
  return buildMetadata({
    title: found.page.title,
    description: found.page.description,
    path: `/${found.page.slug}`,
  });
}

export default function LandingPage({ params }) {
  const found = findPage(params.slug);
  if (!found) notFound();

  const { page, kind } = found;
  const areaServed = kind === "area" ? [page.area, ...page.landmarks] : ["Delhi NCR"];

  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema({ areaServed }),
          serviceSchema({
            name: page.h1,
            description: page.description,
            areaServed,
            path: `/${page.slug}`,
          }),
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: kind === "area" ? "Areas We Serve" : "Home Tuition", href: "/services" },
            { name: page.h1, href: `/${page.slug}` },
          ]),
          faqSchema(page.faqs),
        ]}
      />
      <LandingSection page={page} kind={kind} />
      <link rel="preconnect" href={SITE.url} />
    </>
  );
}
