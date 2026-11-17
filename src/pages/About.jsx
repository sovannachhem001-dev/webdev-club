
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
        <h2>Who We Are</h2>
        <p>
          WebDev Club is a community of students
          passionate about web development and technology.
          We learn together, share ideas, and build
          creative projects to improve our skills.
        </p>
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
