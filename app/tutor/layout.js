// app/tutor/layout.js — bare shell for the tutor panel (no public header/footer)
import "@/styles/tutor-panel.css";

export const metadata = {
  title: { default: "Tutor Panel", template: "%s | Gayatri Home Tutors" },
  robots: { index: false, follow: false },
};

export default function TutorLayout({ children }) {
  return <div className="tutor-root">{children}</div>;
}
