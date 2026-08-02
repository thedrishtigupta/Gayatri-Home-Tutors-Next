// components/sections/PageSection.jsx
// Server component — wraps any section with the standard heading pattern

export default function PageSection({ id, title, subtitle, children }) {
  return (
    // <section className="sections">
    //   <div className="section-container">
    //     <h1 id={id}>{title}</h1>
    //     {subtitle && <p className="sections-p">{subtitle}</p>}
    //     <div className="section-body">
    //       {children}
    //     </div>
    //   </div>
    // </section>
    <section className="sections">
        <div className="section-container">
            <div className="section-heading" id={id}>
            <h1>{title}</h1>
            </div>
            <p className="sections-p">{subtitle}</p>
        </div>

        <div className="section-body">
            {children}
        </div>
        </section>
  );
}