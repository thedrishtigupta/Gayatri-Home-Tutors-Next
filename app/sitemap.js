// app/sitemap.js — sitemap.xml covering core pages, FAQ and all SEO landing pages.

import { SITE, AREA_PAGES, TOPIC_PAGES } from "@/lib/siteData";

export default function sitemap() {
  const base = SITE.url;

  const core = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/services", changeFrequency: "monthly", priority: 0.9 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/become-tutor", changeFrequency: "monthly", priority: 0.8 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  const landing = [
    ...AREA_PAGES.map((p) => ({ path: `/${p.slug}`, changeFrequency: "monthly", priority: 0.8 })),
    ...TOPIC_PAGES.map((p) => ({ path: `/${p.slug}`, changeFrequency: "monthly", priority: 0.7 })),
  ];

  // No per-page authoring timestamp is tracked, so <lastmod> is intentionally omitted
  // rather than emitting a misleading build-time date on every URL.
  return [...core, ...landing].map((e) => ({
    url: `${base}${e.path === "/" ? "" : e.path}`,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
