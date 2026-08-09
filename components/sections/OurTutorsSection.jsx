// Tutor data — swap with API call once backend is ready
const TUTORS = [
  { name: "Anjali Sharma", classes: "6th – 10th", subjects: "Maths, Science",   experience: "5 Years", education: "B.Sc Mathematics, Delhi University", img: "/assets/images/sherlock-edited-scaled.jpeg" },
  { name: "Anjali Sharma", classes: "6th – 10th", subjects: "Maths, Science",   experience: "5 Years", education: "B.Sc Mathematics, Delhi University", img: "/assets/images/sherlock-edited-scaled.jpeg" },
  { name: "Anjali Sharma", classes: "6th – 10th", subjects: "Maths, Science",   experience: "5 Years", education: "B.Sc Mathematics, Delhi University", img: "/assets/images/sherlock-edited-scaled.jpeg" },
  { name: "Anjali Sharma", classes: "6th – 10th", subjects: "Maths, Science",   experience: "5 Years", education: "B.Sc Mathematics, Delhi University", img: "/assets/images/sherlock-edited-scaled.jpeg" },
  { name: "Anjali Sharma", classes: "6th – 10th", subjects: "Maths, Science",   experience: "5 Years", education: "B.Sc Mathematics, Delhi University", img: "/assets/images/sherlock-edited-scaled.jpeg" },
];

export default function OurTutorsSection() {
  return (
    <div className="tutor-grid">
      {TUTORS.map(({ name, classes, subjects, experience, education, img }, i) => (
        <div className="tutor-card blue" key={i}>
          <div className="upper-tutor-card">
            <div className="tutor-img">
              <img src={img} alt={name} />
            </div>
            <div className="tutor-info">
              <h5 className="tutor-name">{name}</h5>
              <ul className="tutor-details">
                <li><strong>Classes:</strong> {classes}</li>
                <li><strong>Subjects:</strong> {subjects}</li>
                <li><strong>Experience:</strong> {experience}</li>
              </ul>
            </div>
          </div>
          <div className="lower-tutor-card">
            <p className="tutor-education"><strong>Education:</strong> {education}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
