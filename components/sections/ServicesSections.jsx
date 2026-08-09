"use client";
import Link from "next/link";
import OurTutorsSection from "./OurTutorsSection";
import {SectionGrid} from "../layout/SectionGrid";
import PageSection from "./PageSection";

const SUBJECTS = [
  { color: "pink",   title: "Primary (1–5)",    subjects: ["English", "Hindi", "Mathematics", "EVS", "Computer"] },
  { color: "orange", title: "Middle (6–8)",      subjects: ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Sanskrit"] },
  { color: "purple", title: "Secondary (9–10)",  subjects: ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Computer"] },
  { color: "green",  title: "Senior (11–12)",    subjects: ["Physics", "Chemistry", "Biology", "English", "Accounts", "Mathematics", "Business Studies", "Economics", "Computer Science"] },
  { color: "blue",   title: "Advanced",          subjects: ["JEE prep", "NEET prep", "CUET prep", "CA Foundation prep", "Govt. Exams prep"] },
];

const AREAS = [
  { icon: "/assets/images/location.png" , color: "blue-line",    name: "Pitampura",     detail: "Near Kohat Enclave, Madhuban Chowk" },
  { icon: "/assets/images/location-black.png" ,  color: "yellow-line",  name: "Paschim Vihar", detail: "A, B, C, D Block" },
  { icon: "/assets/images/location.png" ,  color: "blue-line", name: "Ashok Vihar",   detail: "Phase 1, 2, 3, 4" },
  { icon: "/assets/images/location-black.png" ,  color: "yellow-line", name: "Model Town",    detail: "Model Town I, II, III" },
  { icon: "/assets/images/location.png" ,  color: "blue-line",   name: "Shalimar Bagh", detail: "Block A, B, C, D Areas" },
  { icon: "/assets/images/location-black.png" ,  color: "yellow-line",    name: "Rohini",        detail: "Sectors 3, 7, 9, 11, 13, 15" },
  { icon: "/assets/images/location.png" ,  color: "blue-line",   name: "Punjabi Bagh",  detail: "East & West Punjabi Bagh" },
];

const HOW_IT_WORKS = [
  { icon: "/assets/images/call-blue.png",    color: "blue-text",  step: "1. Contact", desc: "Share your requirements." },
  { icon: "/assets/images/search-blue.png",   color: "blue-text",   step: "2. Match",   desc: "Find your desired tutor." },
  { icon: "/assets/images/star-blue.png",   color: "blue-text", step: "3. Review",  desc: "Check credentials & rates." },
  { icon: "/assets/images/hat-blue.png",color: "blue-text", step: "4. Learn",   desc: "Start your demo class." },
];

export default function ServicesSections() {
  return (
    <>
      {/* Subjects Grid */}
      <div className="subjects-section">
        <h2>Subjects We Cover</h2>
        <div className="subjects-grid">
          {SUBJECTS.map(({ color, title, subjects }) => (
            <div className={`subjects-grid-els ${color}`} key={title}>
              <div className="subjects-grid-upper-el"><h3>{title}</h3></div>
              <div className="subjects-grid-lower-el">
                <ul>
                  {subjects.map(s => (
                    <li key={s}>
                      <img src="/assets/images/checkmark-blue.png" alt="" />
                      <p>{s}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Areas */}
      <SectionGrid
        title="We Serve Across Delhi NCR"
        subtitle="Expert tutors available in your locality"
        gridClass="lower-area-grid"
        items={AREAS}
        renderItem={({ color, name, detail, icon}) => (
          <div className={`area-grid-els ${color}`} key={name}>
            <div className="contact-item">
              <div className="contact-icon blue">
                <img src={icon} alt="location" />
              </div>
              <div className="contact-text">
                <h3 className="area-h3">{name}</h3>
                <p className="area-p">{detail}</p>
              </div>
            </div>
          </div>
        )}
      />

      {/* Can't find your area */}
      <div className="about-mission">
        <div className="mission-content">
          <h2 className="find-area-h2 orange-text">Can't Find Your Area?</h2>
          <p className="find-area-p">
            We're constantly expanding our services. If your area is not listed above, don't worry!
            Contact us and we'll do our best to arrange a tutor for you.
          </p>
          <div className="find-area-grid">
            {["One-on-one personalized attention", "Flexible scheduling at your convenience", "Regular assessments and progress tracking"].map(text => (
              <div className="find-area-grid-els" key={text}>
                <div className="find-area-grid-icon"><img src="/assets/images/checkmark-yellow.png" alt="check" /></div>
                <p className="find-area-grid-els-p">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="book-button">
          <Link href="/contact" id="contact-us-btn">Contact Us</Link>
        </div>
      </div>

      {/* How It Works */}
      <SectionGrid
        title="How It Works?"
        subtitle="Four simple steps to connect with an expert tutor and start learning today."
        titleColor="blue-text"
        gridClass="lower-values-grid how-it-works-grid"
        items={HOW_IT_WORKS}
        renderItem={({ icon, color, step, desc }) => (
            <div className="grid-els how-it-works-grid-els" key={step}>
              <div className="grid-icon"><img src={icon} alt={step} /></div>
              <h3 className={color}>{step}</h3>
              <p>{desc}</p>
            </div>
          )}
        />

      {/* Our Expert Tutors */}
      <PageSection
        id="our-tutor-heading"
        title="Our Expert Tutors"
        subtitle="Verified and experienced educators dedicated to your success"
      >
        <OurTutorsSection />
      </PageSection>
    </>
  );
}
