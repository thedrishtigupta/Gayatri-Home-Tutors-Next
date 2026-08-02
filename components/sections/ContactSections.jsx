import BookDemoForm from "../forms/BookDemoForm";

const CONTACT_INFO = [
  {
    color: "blue",
    icon: "/assets/images/call.png",
    title: "Call Us",
    content: <a href="tel:+918505952700">+91 85059 52700</a>,
  },
  {
    color: "pink",
    icon: "/assets/images/email-black.png",
    title: "Email Us",
    content: <a href="mailto:gayatrihometutor@gmail.com">gayatrihometutor@gmail.com</a>,
  },
  {
    color: "purple",
    icon: "/assets/images/location-black.png",
    title: "Location",
    content: <p>Pitampura, Delhi NCR, India</p>,
  },
  {
    color: "orange",
    icon: "/assets/images/time.png",
    title: "Office Hours",
    content: (
      <div className="office-para">
        <p>Monday – Saturday: 9:00 AM – 8:00 PM</p>
        <p>Sunday: 10:00 AM – 6:00 PM</p>
      </div>
    ),
  },
];

export default function ContactSections() {
  return (
    <div className="contact-grid">

      {/* Form */}
      <div className="send-message">
        <h2 className="contact-h2">Send us a message</h2>
        <div id="book-demo-form-container">
          <BookDemoForm />
        </div>
      </div>

      {/* Info */}
      <div className="contact-info">
        <h2 className="contact-h2">Contact Information</h2>
        <div className="contact-els">
          <div className="contact-boxes">
            {CONTACT_INFO.map(({ color, icon, title, content }) => (
              <div className="contact-grid-els" key={title}>
                <div className="contact-item">
                  <div className={`contact-icon ${color}`}>
                    <img src={icon} alt={title} />
                  </div>
                  <div className="contact-text">
                    <h3>{title}</h3>
                    {content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
