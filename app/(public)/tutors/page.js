// app/(public)/tutors/page.js — the tutor discovery hub.
//
// A server component on purpose: results are in the HTML, so a crawler sees
// real tutors rather than an empty shell. Filters live in the URL, which keeps
// the page shareable and lets the faceted routes reuse the same query layer.

import Link from "next/link";
import PagesHero from "@/components/layout/PagesHero";
import TutorCard from "@/components/tutors/TutorCard";
import TutorFilters from "@/components/tutors/TutorFilters";
import { getFacets, searchTutors, CORE_SUBJECT_SLUGS } from "@/lib/tutorSearch";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

/* Facet counts below this are too thin to surface as a browse link: a visitor
   who clicks "German (8)" and finds nobody near them has been sent on a wasted
   trip. The filters still offer everything. */
const BROWSE_MIN = 20;

/*
 * One stable title for the hub. Filter combinations live behind query params
 * and are not separate pages; the per-combination titles belong on the faceted
 * routes (/tutors/rohini/class-10/maths), where each really is its own page.
 */
export const metadata = buildMetadata({
  title: "Home tutors in Delhi NCR",
  description:
    "Find verified home tutors across Delhi NCR. Filter by subject, class and area, then book a free demo class before you decide.",
  path: "/tutors",
});

/**
 * Turn ?subject=mathematics,science&class=class-10&area=rohini into facet rows.
 * Subject is a comma-separated list; the rest are single.
 */
function resolveSlugs(searchParams, facets) {
  const find = (list, slug) => (slug ? list.find((x) => x.slug === slug) || null : null);
  const subjectSlugs = String(searchParams?.subject || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  return {
    subjects: subjectSlugs.map((slug) => find(facets.subjects, slug)).filter(Boolean),
    class: find(facets.classes, searchParams?.class),
    area: find(facets.areas, searchParams?.area),
  };
}

export default async function TutorsPage({ searchParams }) {
  const facets = await getFacets();
  const selected = resolveSlugs(searchParams, facets);

  const page = Math.max(1, Number.parseInt(searchParams?.page, 10) || 1);

  const { tutors, total, totalPages } = await searchTutors({
    subjectIds: selected.subjects.map((s) => s.id),
    classId: selected.class?.id,
    areaId: selected.area?.id,
    gender: searchParams?.gender,
    mode: searchParams?.mode,
    minExperience: searchParams?.minExperience,
    name: searchParams?.q,
    sort: searchParams?.sort,
    page,
  });

  const activeChips = [
    ...selected.subjects.map((s) => ({ key: "subject", value: s.slug, label: s.name })),
    selected.class && { key: "class", label: selected.class.name },
    selected.area && { key: "area", label: selected.area.name },
    searchParams?.minExperience && { key: "minExperience", label: `${searchParams.minExperience}+ years` },
    searchParams?.mode && { key: "mode", label: searchParams.mode },
    searchParams?.gender && { key: "gender", label: searchParams.gender },
    searchParams?.q && { key: "q", label: `"${searchParams.q}"` },
  ].filter(Boolean);

  // The heading stays put. What the visitor filtered to is already visible in
  // the chips and the count line, and a heading that rewrites itself on every
  // click is disorienting.
  const heading = "Home tutors in Delhi NCR";

  // A plain-English summary of the current filters, for the line beneath it.
  const filterSummary = [
    searchParams?.q && `Name matching “${searchParams.q}”`,
    selected.subjects.map((s) => s.name).join(" & "),
    selected.class?.name,
    selected.area && `in ${selected.area.name}`,
  ]
    .filter(Boolean)
    .join(" · ");


  const browseAreas = facets.areas.filter((a) => a.tutor_count >= BROWSE_MIN).slice(0, 18);
  const browseSubjects = facets.subjects.filter((s) => s.tutor_count >= BROWSE_MIN);
  const browseClasses = facets.classes.filter((c) => c.tutor_count >= BROWSE_MIN);

  /** Current URL with some params replaced — used by pagination and browse links. */
  const qs = (overrides) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...searchParams, ...overrides })) {
      if (v) p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `/tutors?${s}` : "/tutors";
  };

  return (
    <>
      <PagesHero
        title="Find a home tutor"
        subtitle="Verified tutors across Delhi NCR — browse by subject, class or area"
      />

      <section className="td-page">
        <div className="td-layout">
          <aside className="td-sidebar">
            <TutorFilters
              facets={facets}
              active={activeChips}
              coreSubjectSlugs={CORE_SUBJECT_SLUGS}
            />
          </aside>

          <div className="td-results" data-tutor-total={total}>
            <div className="td-results-head">
              <h2>{heading}</h2>
              <p>
                {total === 0
                  ? "No tutors match these filters yet."
                  : totalPages > 1
                    ? `Page ${page} of ${totalPages}`
                    : ""}
                {filterSummary && <span className="td-filter-summary">{filterSummary}</span>}
              </p>
            </div>

            {tutors.length === 0 ? (
              <div className="td-empty">
                <h2>Nothing matches yet</h2>
                <p>
                  {searchParams?.q
                    ? `No tutor's name matches “${searchParams.q}”. Check the spelling, or clear the search to browse everyone.`
                    : "Try removing a filter, or widening the area. We add tutors every week, and the office can often find someone who is not listed yet."}
                </p>
                <div className="td-empty-actions">
                  <Link href="/tutors" className="td-demo-btn">Clear filters</Link>
                  <Link href="/contact" className="td-secondary-btn">Ask the office</Link>
                </div>
              </div>
            ) : (
              <>
                <div className="tutor-grid td-grid">
                  {tutors.map((tutor) => (
                    <TutorCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav className="td-pagination" aria-label="Tutor pages">
                    {page > 1 ? (
                      <Link href={qs({ page: page - 1 === 1 ? "" : page - 1 })} className="td-secondary-btn">
                        ← Previous
                      </Link>
                    ) : (
                      <span />
                    )}
                    <span className="td-page-count">
                      Page {page} of {totalPages}
                    </span>
                    {page < totalPages ? (
                      <Link href={qs({ page: page + 1 })} className="td-secondary-btn">
                        Next →
                      </Link>
                    ) : (
                      <span />
                    )}
                  </nav>
                )}
              </>
            )}

            {/* Internal linking. These crawlable anchors are how a directory
                gets discovered: they give search engines a path into every
                facet combination that has real depth behind it. */}
            <nav className="td-browse" aria-label="Browse tutors">
              <BrowseBlock
                heading="Browse by area"
                items={browseAreas}
                hrefFor={(a) => qs({ area: a.slug, page: "" })}
                current={selected.area?.slug}
              />
              <BrowseBlock
                heading="Browse by subject"
                items={browseSubjects}
                // One subject at a time here: these links are entry points for
                // search traffic, not a way to build a multi-subject query.
                hrefFor={(s) => qs({ subject: s.slug, page: "" })}
                current={selected.subjects[0]?.slug}
              />
              <BrowseBlock
                heading="Browse by class"
                items={browseClasses}
                hrefFor={(c) => qs({ class: c.slug, page: "" })}
                current={selected.class?.slug}
              />
            </nav>

            <section className="td-cta">
              <h2>Not sure who to pick?</h2>
              <p>
                Tell us the class, subject and your area, and the office will suggest tutors who are already
                teaching nearby. Every first class is a free demo.
              </p>
              <Link href="/book-demo" className="td-demo-btn">Book a free demo class</Link>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

function BrowseBlock({ heading, items, hrefFor, current }) {
  if (!items.length) return null;
  return (
    <div className="td-browse-block">
      <h2>{heading}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={hrefFor(item)} className={item.slug === current ? "is-current" : undefined}>
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
