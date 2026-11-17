
import { useState } from "react";
import { supabase } from "../services/supabase";
import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    const { error } = await supabase
      .from("contact_messages")
      .insert([formData]);

    if (error) {
      setStatus("Error: " + error.message);
    } else {
      setStatus("Message sent successfully!");
      setFormData({
        name: "",
        email: "",
        message: "",
      });
    }

    setLoading(false);
  }

  return (
    <section className="contact-page">
      <h1>Contact Us</h1>
      <p className="contact-intro">
        Have a question? We'd love to hear from you.
      </p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label>Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name"
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />

        <label>Message</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Write your message..."
          rows="5"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Message"}
        </button>

        {status && <p>{status}</p>}
      </form>
    </section>
  );
}

export default Contact;
