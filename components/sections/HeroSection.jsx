"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

const IMAGES = [
  "/assets/images/img3.jpeg",
  "/assets/images/img1.webp",
  "/assets/images/img2.jpg",
];

const STATS = [
  { value: "4250+", label: "Qualified Tutors",  id: "hero-bot-top-txt-1" },
  { value: "8650+", label: "Happy Students",    id: "hero-bot-top-txt-2" },
  { value: "16+",   label: "Years Experience",  id: "hero-bot-top-txt-3" },
  { value: "100%",  label: "Free Demo",         id: "hero-bot-top-txt-4" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  // Auto-advance every 3 s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-section">
      <div className="container">

        <div className="hero-top-sec">
          {/* Left */}
          <div className="left-container">
            <h1>
              Expert Home Tutors for
              <span>Academic Excellence</span>
            </h1>
            <p>
              Connect with 4,250+ qualified tutors across Delhi NCR.
              Personalized learning, proven results, and free demo classes.
            </p>
            <div className="main-book">
              <Link href="/contact"      id="btn1">Book Free Demo</Link>
              <Link href="/become-tutor" id="btn2">Become a Tutor</Link>
            </div>
          </div>

          {/* Right – image slider */}
          <div className="right-container">
            <div className="hero-image-tab">
              <div className="hero-images">
                {IMAGES.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`slide-${i}`}
                    className={`hero-img${i === current ? " active" : ""}`}
                  />
                ))}
              </div>
            </div>
            <div className="hero-image-scroll">
              {IMAGES.map((_, i) => (
                <div
                  key={i}
                  className={`hero-scroll-circle${i === current ? " active" : ""}`}
                  onClick={() => setCurrent(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="hero-bottom-strip">
          {STATS.map(({ value, label, id }) => (
            <div className="hero-bot-strip-el" key={id}>
              <div className="hero-bot-strip-top" id={id}>{value}</div>
              <div className="hero-bot-strip-bot">{label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
