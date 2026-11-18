
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">Student Developer Community</span>

          <h1>
            Welcome to <span>WebDev Club</span>
          </h1>

          <p>
            A community of passionate developers.
            Learn new skills, build amazing projects,
            and grow together with us.
          </p>

          <Link to="/contact" className="hero-btn">
            Join Our Club
          </Link>

          <div className="hero-highlights">
            <div>
              <strong>Learn</strong>
              <span>Modern web skills</span>
            </div>
            <div>
              <strong>Build</strong>
              <span>Real projects</span>
            </div>
            <div>
              <strong>Grow</strong>
              <span>Strong community</span>
            </div>
          </div>

        </div>
      </section>

      {/* About Section */}
      <section className="section">
        <span className="section-eyebrow">Why join us</span>
        <h2>About Our Club</h2>

        <p>
          WebDev Club is a community where students
          learn web development, share knowledge,
          collaborate, and create real-world projects.
        </p>

        <div className="club-values">
          <div>
            <span>01</span>
            <h3>Practical Learning</h3>
            <p>Learn through hands-on sessions, challenges, and guided projects.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Team Collaboration</h3>
            <p>Work with peers, exchange ideas, and experience real development workflows.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Career Growth</h3>
            <p>Build confidence and a portfolio that demonstrates what you can create.</p>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="section">
        <h2>What We Do</h2>

        <p>Explore our activities and opportunities.</p>

        <div className="activity-grid">

          <div className="activity-card">
            <h3>💻 Web Development</h3>
            <p>
              Learn HTML, CSS, JavaScript, React,
              and modern web technologies.
            </p>
          </div>

          <div className="activity-card">
            <h3>🚀 Team Projects</h3>
            <p>
              Work together and build real-world
              websites and applications.
            </p>
          </div>

          <div className="activity-card">
            <h3>🎓 Workshops</h3>
            <p>
              Join workshops, share knowledge,
              and improve your technical skills.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}

export default Home;
