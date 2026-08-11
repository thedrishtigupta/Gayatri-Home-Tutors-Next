import Link from "next/link";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { SITE, AREA_PAGES, TOPIC_PAGES } from "@/lib/siteData";

/**
 * components/seo/LandingSection.jsx
 * Shared, server-rendered layout for every SEO landing page
 * (locality pages and topic pages). Content comes from lib/siteData.js
 * so each URL renders unique copy, headings and FAQs.
 */
export default function LandingSection({ page, kind }) {
  const isArea = kind === "area";
  const subjects = isArea ? null : page.subjects;
  const related = (isArea ? AREA_PAGES : TOPIC_PAGES)
    .filter((p) => p.slug !== page.slug)
    .slice(0, 6);
  const cross = (isArea ? TOPIC_PAGES : AREA_PAGES).slice(0, 6);

  return (
    <article className="seo-landing">
      <div className="seo-wrap">
        <Breadcrumbs
          trail={[
            { name: "Home", href: "/" },
            { name: isArea ? "Areas We Serve" : "Home Tuition", href: "/services" },
            { name: page.h1, href: `/${page.slug}` },
          ]}
        />

        <div className="seo-hero">
          <h1>{page.h1}</h1>
          <p className="seo-lede">{page.intro}</p>
          <div className="seo-cta-row">
            <Link href="/contact" className="seo-btn seo-btn-primary">
              Book a free demo class
            </Link>
            <a href={`tel:${SITE.phone}`} className="seo-btn seo-btn-ghost">
              Call {SITE.phoneDisplay}
            </a>
          </div>
          <div className="seo-hero-image">
            <div className="hero-image-tab">
              <img className="hero-images" src="/assets/images/sherlock-edited-scaled.jpeg" alt="" />
            </div>
          </div>
          
        </div>

        {isArea ? (
          <>
            <section className="seo-block" aria-labelledby="coverage">
              <h2 id="coverage">Home tuition across {page.area}</h2>
              <p>{page.localContext}</p>
              <h3>Localities we cover in {page.area}</h3>
              <ul className="seo-chips">
                {page.landmarks.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <h3>Boards supported</h3>
              <ul className="seo-chips">
                {page.boards.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>

            <section className="seo-block" aria-labelledby="how">
              <h2 id="how">How it works in {page.area}</h2>
              <ol className="seo-steps">
                <li><strong>Tell us the requirement</strong> — class, subjects, board and your exact locality.</li>
                <li><strong>Get matched profiles</strong> — verified tutors living near you, usually within 24 hours.</li>
                <li><strong>Take a free demo class</strong> — meet the tutor at home, at no cost.</li>
                <li><strong>Start regular classes</strong> — fixed slots, monthly progress updates, tutor change on request.</li>
              </ol>
            </section>
          </>
        ) : (
          <>
            <section className="seo-block" aria-labelledby="what">
              <h2 id="what">What this programme covers</h2>
              <ul className="seo-list">
                {page.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>

            <section className="seo-block" aria-labelledby="subjects">
              <h2 id="subjects">Subjects available</h2>
              <ul className="seo-chips">
                {subjects.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          </>
        )}

        <section className="seo-block" aria-labelledby="why">
          <h2 id="why">Why families choose Gayatri Home Tutors</h2>
          <div className="seo-grid">
            <div><h3>Verified tutors</h3><p>ID, address and qualification documents are checked before any placement.</p></div>
            <div><h3>Free demo class</h3><p>Meet the tutor and see the teaching style before you pay anything.</p></div>
            <div><h3>Since 2010</h3><p>Fifteen years of matching Delhi NCR families with the right teacher.</p></div>
            <div><h3>Tutor change on request</h3><p>If the fit is wrong, we arrange a replacement demo at no extra cost.</p></div>
          </div>
        </section>

        <section className="seo-block" aria-labelledby="faq">
          <h2 id="faq">Frequently asked questions</h2>
          <div className="seo-faq">
            {page.faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p className="seo-more">
            More questions? Read our <Link href="/faq">complete FAQ</Link>.
          </p>
        </section>

        <section className="seo-block" aria-labelledby="related">
          <h2 id="related">{isArea ? "Other areas we serve" : "Explore other programmes"}</h2>
          <ul className="seo-links">
            {related.map((p) => (
              <li key={p.slug}><Link href={`/${p.slug}`}>{p.h1}</Link></li>
            ))}
          </ul>
          <h3>{isArea ? "Popular programmes" : "Popular locations"}</h3>
          <ul className="seo-links">
            {cross.map((p) => (
              <li key={p.slug}><Link href={`/${p.slug}`}>{p.h1}</Link></li>
            ))}
          </ul>
        </section>

        <section className="seo-final-cta">
          <h2>Book a free demo class today</h2>
          <p>Tell us the class, subjects and locality — we will share matching tutor profiles within 24 hours.</p>
          <div className="seo-cta-row">
            <Link href="/contact" className="seo-btn seo-btn-primary">Book free demo</Link>
            <a href={`tel:${SITE.phone}`} className="seo-btn seo-btn-ghost">Call {SITE.phoneDisplay}</a>
          </div>
        </section>
      </div>
    </article>
  );
}
