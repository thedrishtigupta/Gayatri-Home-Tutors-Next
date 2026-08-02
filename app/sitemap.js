// app/sitemap.js — auto-generated sitemap.xml for SEO

export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://gayatrihometutors.com";
  const now  = new Date().toISOString();

  return [
    { url: base,                    lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/about`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/services`,      lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contact`,       lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/become-tutor`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/terms`,         lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
  ];
}
