
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">

      <Link to="/" className="logo">
        <span className="logo-icon">&lt;/&gt;</span>
        WebDev<span>Club</span>
      </Link>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/members">Members</Link>
        <Link to="/gallery">Gallery</Link>
        <Link to="/contact">Contact</Link>
      </nav>

      <Link to="/contact" className="join-btn">
        Join Our Club
      </Link>

    </header>
  );
}

export default Navbar;
