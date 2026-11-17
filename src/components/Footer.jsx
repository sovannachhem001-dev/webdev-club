
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2>WebDev<span>Club</span></h2>
          <p>
            Learn, Build, and Grow Together.
            Empowering the next generation of developers.
          </p>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/members">Members</a>
          <a href="/events">Events</a>
        </div>

        <div className="footer-links">
          <h3>Contact</h3>
          <a href="/contact">Contact Us</a>
          <a href="mailto:webdevclub@example.com">
            Email Us
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} WebDev Club.
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
