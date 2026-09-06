// components/tutors/TutorCard.jsx
//
// One tutor, as families see them.
//
// Two columns: the photo fills the left half top to bottom, and every detail
// sits to its right. Nothing is stacked underneath the photo.
//
// Deliberately shows no phone number, email or address: a family reaches a
// tutor by requesting a demo, which is what "Book a free demo" does.

import Link from "next/link";

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

export default function TutorCard({ tutor, showDemoButton = true }) {
  const {
    id,
    name,
    image,
    verified,
    experienceYears,
    qualification,
    specialization,
    institution,
    subjects = [],
    classRange,
    areas = [],
    mode,
  } = tutor;

  // Long lists get truncated with a count rather than wrapping to five lines.
  const shownSubjects = subjects.slice(0, 4);
  const moreSubjects = subjects.length - shownSubjects.length;
  const shownAreas = areas.slice(0, 3);
  const moreAreas = areas.length - shownAreas.length;

  const education = [qualification, specialization, institution].filter(Boolean).join(", ");

  return (
    <article className="td-card">
      <div className="td-card-photo">
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <span className="td-initials" aria-hidden="true">{initialsOf(name)}</span>
        )}
      </div>

      <div className="td-card-body">
        <h3 className="td-card-name">
          {name}
          {verified && (
            <span className="td-verified" title="Verified by Gayatri Home Tutors">✓ Verified</span>
          )}
        </h3>

        <dl className="td-card-facts">
          {classRange && (
            <div><dt>Classes</dt><dd>{classRange}</dd></div>
          )}
          <div>
            <dt>Subjects</dt>
            <dd>
              {shownSubjects.length
                ? shownSubjects.map((s) => s.name).join(", ") + (moreSubjects > 0 ? ` +${moreSubjects} more` : "")
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Experience</dt>
            <dd>
              {experienceYears == null
                ? "Not stated"
                : experienceYears === 0
                  ? "New tutor"
                  : `${experienceYears} year${experienceYears === 1 ? "" : "s"}`}
            </dd>
          </div>
          {education && (
            <div><dt>Education</dt><dd>{education}</dd></div>
          )}
          {shownAreas.length > 0 && (
            <div>
              <dt>Teaches in</dt>
              <dd>
                {shownAreas.map((a) => a.name).join(", ")}
                {moreAreas > 0 ? ` +${moreAreas} more` : ""}
              </dd>
            </div>
          )}
          {mode && (
            <div><dt>Mode</dt><dd>{mode}</dd></div>
          )}
        </dl>

        {showDemoButton && (
          <div className="td-card-foot">
            <Link href={`/book-demo?tutor=${id}`} className="td-demo-btn">
              Book a free demo
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
