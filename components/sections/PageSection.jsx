// components/sections/PageSection.jsx
// Server component — wraps any section with the standard heading pattern

export default function PageSection({ id, title, subtitle, children }) {
  return (
    <section className="sections">
        <div className="section-container">
            <div className="section-heading" id={id}>
            {/* A section heading, not the page title — pages own their <h1>. */}
            <h2>{title}</h2>
            </div>
            <p className="sections-p">{subtitle}</p>
        </div>

        <div className="section-body">
            {children}
        </div>
        </section>
  );
}