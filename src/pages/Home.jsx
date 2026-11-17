
import "./Home.css";

function Home() {
  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">

          <h1>
            Welcome to <span>WebDev Club</span>
          </h1>

          <p>
            A community of passionate developers.
            Learn new skills, build amazing projects,
            and grow together with us.
          </p>

          <a href="/contact" className="hero-btn">
            Join Our Club
          </a>

        </div>
      </section>

      {/* About Section */}
      <section className="section">
        <h2>About Our Club</h2>

        <p>
          WebDev Club is a community where students
          learn web development, share knowledge,
          collaborate, and create real-world projects.
        </p>
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
