// app/(public)/book-demo/page.js — the demo booking page.
//
// Two ways in, one page:
//   /book-demo            — a general enquiry; the office suggests a tutor
//   /book-demo?tutor=1148 — "I want a demo with this tutor", from their card
//
// The tutor is resolved on the server so the family sees a real name and photo
// confirming who they picked, and so an id for a tutor who is no longer active
// cannot be smuggled in through the query string.

import Link from "next/link";
import PagesHero from "@/components/layout/PagesHero";
import BookDemoForm from "@/components/forms/BookDemoForm";
import TutorCard from "@/components/tutors/TutorCard";
import { getTutorPublicById } from "@/lib/tutorSearch";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const BASE = {
  title: "Book a free demo class",
  description:
    "Book a free demo class with a verified home tutor in Delhi NCR. Tell us the class, subjects and your area, and we will arrange a demo before you commit.",
  path: "/book-demo",
};

/*
 * ?tutor=<id> is the same page with one field pre-decided, not a page of its
 * own, so those variants stay out of the index and point their canonical at
 * the clean URL. Without this, one booking form would compete with itself in
 * search results once for every active tutor.
 */
export async function generateMetadata({ searchParams }) {
  const meta = buildMetadata(BASE);
  if (!searchParams?.tutor) return meta;

  const tutor = await getTutorPublicById(searchParams.tutor);
  return {
    ...meta,
    title: tutor ? `Book a free demo with ${tutor.name}` : meta.title,
    robots: { index: false, follow: true },
  };
}

export default async function BookDemoPage({ searchParams }) {
  const requestedId = searchParams?.tutor ?? null;
  const tutor = requestedId ? await getTutorPublicById(requestedId) : null;

  // Asked for someone specific, but that tutor is gone or was never valid.
  const requestedButMissing = Boolean(requestedId) && !tutor;

  return (
    <>
      <PagesHero
        title="Book a free demo class"
        subtitle={
          tutor
            ? `Request a demo with ${tutor.name} — no charge, no commitment`
            : "Meet the tutor before you decide — the first class is always free"
        }
      />

      <section className="bd-page">
        <div className={`bd-layout${tutor ? " has-tutor" : ""}`}>
          {tutor && (
            <aside className="bd-tutor" aria-label="Tutor you are requesting">
              <h2 className="bd-tutor-heading">You are requesting</h2>
              {/* No demo button on this card: the family is already on the
                  booking page, and a second CTA here would just loop back. */}
              <TutorCard tutor={tutor} showDemoButton={false} />
              <p className="bd-tutor-note">
                Not the right fit?{" "}
                <Link href="/tutors">Browse other tutors</Link> or{" "}
                <Link href="/book-demo">book without choosing a tutor</Link>.
              </p>
            </aside>
          )}

          <div className="bd-form-side">
            {requestedButMissing && (
              <div className="bd-notice" role="status">
                <strong>That tutor is not available right now.</strong>
                <span>
                  Your booking will still reach us — tell us what you need below and the office will
                  suggest tutors who teach the same subjects nearby.
                </span>
              </div>
            )}

            <h2 className="bd-form-heading">
              {tutor ? "Your details" : "Tell us what you need"}
            </h2>
            <p className="bd-form-lead">
              {tutor
                ? "We will pass this to the office and call you to fix a time for the demo."
                : "Share the class, subjects and your area. We will call you with tutors who match, and the first class is a free demo."}
            </p>

            <div id="book-demo-form-container">
              <BookDemoForm requestedTutor={tutor} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
