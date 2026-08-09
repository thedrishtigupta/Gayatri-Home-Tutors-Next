// components/layout/PagesHero.jsx
// Server component — no "use client" needed

export default function PagesHero({ title, subtitle }) {
  return (
    <section className="pages-hero">
      <div className="pages-hero-container blue">
        <div className="page-hero-heading">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}
