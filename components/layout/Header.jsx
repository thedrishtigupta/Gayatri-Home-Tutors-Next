// components/layout/Header.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/",             label: "Home",        },
  { href: "/about",        label: "About",       },
  { href: "/services",     label: "Services",    },
  { href: "/become-tutor", label: "Become Tutor",},
  { href: "/contact",      label: "Contact",     },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header>
      <nav className="header-nav">
        <div className="navbar">
          {/* Logo */}
          <div className="left-nav">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              <div className="GHT-logo">
                <Image src="/assets/images/GHTLogo.svg" alt="GHT Logo" width={60} height={60} priority />
              </div>
              <div className="GHT-text">
                <h1>Gayatri Home Tutors</h1>
                <p>Delhi NCR&apos;s Trusted Tuition Bureau</p>
              </div>
            </Link>
          </div>

          {/* Desktop centre nav */}
          <div className="center-nav">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="cnt-nav-btn"
                style={{ fontWeight: pathname === href ? "700" : undefined }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop right nav */}
          <div className="right-nav">
            <a href="tel:+918505952700" className="link-icon">
              <img src="/assets/images/call.png" className="img-icon" alt="call" />
              <span>+91 85059 52700</span>
            </a>
            <Link href="/contact" className="book-btn">Book Free Demo</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="mobile-nav-open">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>
            ))}
            <Link href="/contact" className="book-btn" onClick={() => setMenuOpen(false)}>
              Book Free Demo
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
