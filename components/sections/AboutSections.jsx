"use client";
import Link from "next/link";
import { SectionGrid } from "../layout/SectionGrid";

const VALUES = [
  { icon: "/assets/images/bullseye-blue.png",title: "Excellence",        desc: "We strive for academic excellence and holistic development of every student" },
  { icon: "/assets/images/heart-blue.png",   title: "Care & Support",    desc: "Personalized attention and nurturing environment for optimal learning" },
  { icon: "/assets/images/star-blue.png",    title: "Quality Education", desc: "Experienced tutors with proven track records and subject expertise" },
  { icon: "/assets/images/users-blue.png",   title: "Community",         desc: "Building lasting relationships with students, parents, and educators" },
];

const TESTIMONIALS = [
  { i: 3, quote: "Excellent service! The Business Studies tutor for my son was highly qualified and made complex topics easy.", subject: "Business Studies", grade: "Class 12th", author: "Priya Malhotra",  location: "Shalimar Bagh, Delhi" },
  { i: 2, quote: "Very reliable and professional service. The tutor arrives on time and my kids enjoy their learning sessions.", subject: "All Subjects",      grade: "Class 6th",  author: "Ayush Aggarwal", location: "Model Town, Delhi" },
  { i: 1, quote: "Gayatri Home Tutor helped my daughter improve her Math scores from 65% to 92% in just 6 months.",           subject: "Mathematics",      grade: "Class 10th", author: "Karan Bansal",   location: "Rohini, Delhi" },
];

const WHY_CHOOSE = [
  "Verified & experienced tutors",
  "Free demo classes available",
  "Flexible timings",
  "Personalized study plans",
  "Regular progress reports",
  "Affordable pricing",
  "All subjects covered",
  "Exam-focused preparation",
];

export default function AboutSections() {
  return (
    <>
      {/* Mission */}
      <div className="about-mission">
        <div className="mission-content">
          <p className="mission-content-p">
            At Gayatri Home Tutor, our mission is to make quality education accessible to every student.
            We believe that <span className="weight-600 yellow-text">personalized attention at home</span> can unlock a
            student's true potential and create lasting academic success.
          </p>
          <p className="mission-content-p">
            Since 2010, we've been connecting students with expert tutors who bring not just subject knowledge,
            but also passion and dedication to teaching. Our tutors are carefully{" "}
            <span className="weight-600 blue-text">selected, verified, trained</span> to provide the best learning experience.
          </p>
        </div>
        <span className="book-button">
          <Link href="/contact">Get Started Today!</Link>
        </span>
      </div>

      {/* Core Values */}
      <SectionGrid
        title="Our Core Values"
        subtitle="The principles that guide our work"
        titleColor="blue-text"
        gridClass="lower-values-grid"
        items={VALUES}
        renderItem={({ icon, title, desc }) => (
          <div className="grid-els" key={title}>
            <div className="grid-icon">
              <img src={icon} alt={title} />
            </div>
            <h3 className="blue-text">{title}</h3>
            <p className="grid-els-p">{desc}</p>
          </div>
        )}
      />

      {/* Testimonials */}
      <section className="card-section">
        <div className="card-track" id="track">
          {TESTIMONIALS.map(({ i, quote, subject, grade, author, location }) => (
            <div className="card blue" style={{ "--i": i }} key={author}>
              <div className="quote-wrapper">
                <span className="quote-mark">"</span>
                <p className="quote-text">{quote}</p>
              </div>
              <div className="caption">
                <div className="left-caption">
                  <p className="left-subject">{subject}</p>
                  <p className="left-class">{grade}</p>
                </div>
                <div className="right-caption">
                  <p className="quote-author">— {author}</p>
                  <p className="right-location">{location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="about-strip">
        <p>Join the growing number of parents who trust us with their child's education.</p>
      </div>

      {/* Why Choose Us */}
      <SectionGrid
        title="Why Choose Us?"
        subtitle="What sets us apart from others"
        titleColor="blue-text"
        gridClass="lower-choose-grid"
        items={WHY_CHOOSE}
        renderItem={(text) => (
          <div className="choose-grid-els" key={text}>
            <div className="grid-icon">
              <img src="/assets/images/checkmark-yellow.png" alt="check" />
            </div>
            <p>{text}</p>
          </div>
        )}
      />
    </>
  );
}
