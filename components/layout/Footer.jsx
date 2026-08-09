import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="upper-footer">

        {/* Brand */}
        <div className="foot-grid-els">
          <div className="left-nav">
            <Link href="/">
              <div className="GHT-logo"><img src="/assets/images/GHTLogo.svg" alt="GHT" /></div>
              <h1 id="footer-heading">Gayatri Home Tutor</h1>
            </Link>
          </div>
          <p id="footer-p">Trusted home tuition bureau since 2010. Connecting students with expert tutors across Delhi NCR.</p>
        </div>

        {/* Links col 1 */}
        <div className="foot-grid-els">
          <ul>
            <li className="li-color-1"><Link href="/about">About Us</Link></li>
            <li className="li-color-2"><Link href="/services">Subjects</Link></li>
            <li className="li-color-3"><Link href="/home-tutor-delhi">Home Tutor in Delhi</Link></li>
            <li className="li-color-4"><Link href="/home-tutor-rohini">Home Tutor in Rohini</Link></li>
            <li className="li-color-5"><Link href="/home-tutor-dwarka">Home Tutor in Dwarka</Link></li>
          </ul>
        </div>

        {/* Links col 2 */}
        <div className="foot-grid-els">
          <ul>
            <li className="li-color-3"><Link href="/faq">FAQ</Link></li>
            <li className="li-color-2"><Link href="/home-tuition-class-9-10">Class 9 &amp; 10 Tuition</Link></li>
            <li className="li-color-4"><Link href="/online-tuition">Online Tuition</Link></li>
            <li className="li-color-5"><Link href="/terms">Terms &amp; Conditions</Link></li>
            <li className="li-color-6"><Link href="/contact">Book Free Demo</Link></li>
            <li className="li-color-7"><Link href="/become-tutor">Become a Tutor</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="foot-grid-els">
          <h4>Contact</h4>
          <ul>
            <li className="li-color-1">
              <a href="tel:+918505952700" className="link-icon">
                <img src="/assets/images/call.png" className="img-icon" alt="call" />
                <span>+91 85059 52700</span>
              </a>
            </li>
            <li className="li-color-2">
              <a href="mailto:gayatrihometutor@gmail.com" className="link-icon">
                <img src="/assets/images/email-black.png" className="img-icon" alt="email" />
                <span>Gayatrihometutor@gmail.com</span>
              </a>
            </li>
            <li className="li-color-3">
              <span className="link-icon">
                <img src="/assets/images/location-black.png" className="img-icon" alt="location" />
                <span>Ranibagh, Delhi-110034</span>
              </span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom */}
      <div className="bottom-footer">
        <div>
          <p>&copy; 2025 Gayatri Home Tutor. All rights reserved.</p>
        </div>
        <div className="social-icons-strip">
          <div className="social-icons-grid">
            <a href="#"><div className="social-icons"><img src="/assets/images/facebook.png"  alt="FB" className="img-icon" /></div></a>
            <a href="#"><div className="social-icons"><img src="/assets/images/instagram.png" alt="IG" className="img-icon" /></div></a>
            <a href="#"><div className="social-icons"><img src="/assets/images/twitter (1).png"   alt="X"  className="img-icon" /></div></a>
            <a href="#"><div className="social-icons"><img src="/assets/images/linkedin.png"  alt="IN" className="img-icon" /></div></a>
          </div>
        </div>
      </div>
    </footer>
  );
}