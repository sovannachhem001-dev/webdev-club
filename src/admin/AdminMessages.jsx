
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import AdminSidebar from "./AdminSidebar";
import "./AdminMessages.css";

function AdminMessages() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  // Check admin access
  async function checkAdmin() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      const user = data.session?.user;

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) throw adminError;

      if (!admin) {
        navigate("/", { replace: true });
        return;
      }

      await fetchMessages();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  // Fetch contact messages
  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMessages(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Delete a message
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this message?"
    );

    if (!confirmed) return;

    setDeleting(id);
    setError("");

    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Message was not deleted. Please check your admin permissions."
        );
      }

      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== id)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString();
  }

  if (loading) {
    return (
      <div className="messages-admin-loading">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <main className="admin-messages-page">
        {/* Header */}
        <header className="messages-page-header">
          <div>
            <h1>Contact Messages</h1>
            <p>View and manage messages from website visitors.</p>
          </div>

          <div className="messages-total-card">
            <span>Total Messages</span>
            <strong>{messages.length}</strong>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="messages-error">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* Messages list */}
        <section className="messages-list-section">
          <div className="messages-list-heading">
            <div>
              <h2>All Messages</h2>
              <p>Newest messages appear first.</p>
            </div>

            <button
              type="button"
              className="messages-refresh-btn"
              onClick={fetchMessages}
            >
              Refresh
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="messages-empty">
              <h3>No messages yet</h3>
              <p>Messages sent through your Contact page will appear here.</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <article
                  className="admin-message-card"
                  key={message.id}
                >
                  <div className="admin-message-top">
                    <div className="admin-message-person">
                      <div className="message-avatar">
                        {message.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>

                      <div>
                        <h3>{message.name}</h3>
                        <a href={`mailto:${message.email}`}>
                          {message.email}
                        </a>
                      </div>
                    </div>

                    <span className="message-date">
                      {formatDate(message.created_at)}
                    </span>
                  </div>

                  <div className="admin-message-content">
                    <p>{message.message}</p>
                  </div>

                  <div className="admin-message-actions">
                    <a
                      className="message-reply-btn"
                      href={`mailto:${encodeURIComponent(message.email)}`}
                    >
                      Reply by Email
                    </a>

                    <button
                      type="button"
                      className="message-delete-btn"
                      disabled={deleting === message.id}
                      onClick={() => handleDelete(message.id)}
                    >
                      {deleting === message.id
                        ? "Deleting..."
                        : "Delete Message"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminMessages;
