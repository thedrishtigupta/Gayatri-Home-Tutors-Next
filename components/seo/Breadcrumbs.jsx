import Link from "next/link";

// components/seo/Breadcrumbs.jsx — accessible breadcrumb trail.
export default function Breadcrumbs({ trail }) {
  return (
    <nav aria-label="Breadcrumb" className="seo-breadcrumbs">
      <ol>
        {trail.map((item, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li key={item.href}>
              {isLast ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <>
                  <Link href={item.href}>{item.name}</Link>
                  <span aria-hidden="true" className="crumb-sep">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
