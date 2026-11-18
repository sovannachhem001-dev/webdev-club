
import "./About.css";

function About() {
  return (
    <div className="about-page">

      <section className="about-hero">
        <h1>About <span>WebDev Club</span></h1>
        <p>
          Building skills, sharing knowledge,
          and creating the future together.
        </p>
      </section>

      <section className="about-intro">
        <span className="section-eyebrow">Our community</span>
        <h2>Who We Are</h2>
        <p>
          WebDev Club is a community of students
          passionate about web development and technology.
          We learn together, share ideas, and build
          creative projects to improve our skills.
        </p>
      </section>

      <section className="learning-section">
        <span className="section-eyebrow">Learning journey</span>
        <h2>What You Can Learn</h2>
        <div className="learning-grid">
          <article>
            <span>01</span>
            <h3>Frontend Development</h3>
            <p>Build responsive interfaces with HTML, CSS, JavaScript, and React.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Backend Development</h3>
            <p>Explore databases, APIs, authentication, and server-side concepts.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Professional Practice</h3>
            <p>Learn Git, teamwork, debugging, code review, and project planning.</p>
          </article>
        </div>
      </section>

      <section className="about-cards">

        <div className="about-card">
          <h3>🎯 Our Mission</h3>
          <p>
            To help students develop practical
            web development skills through learning,
            teamwork, and real projects.
          </p>
        </div>

        <div className="about-card">
          <h3>🌟 Our Vision</h3>
          <p>
            To become a strong developer community
            that inspires innovation and creativity.
          </p>
        </div>

        <div className="about-card">
          <h3>🚀 Our Goals</h3>
          <p>
            Build projects, organize workshops,
            share knowledge, and grow together.
          </p>
        </div>

      </section>

    </div>
  );
}

export default About;
