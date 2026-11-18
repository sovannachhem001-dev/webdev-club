
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SUPABASE_CONFIG_ERROR, supabase } from "../services/supabase";
import AdminSidebar from "./AdminSidebar";
import "./AdminMessages.css";

function AdminMessages() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    checkAdmin();
  }, []);

  // Check admin access
  async function checkAdmin() {
    if (!supabase) {
      setError(SUPABASE_CONFIG_ERROR);
      setLoading(false);
      return;
    }

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

      const loadedMessages = data || [];
      setMessages(loadedMessages);
      setSelectedEmail((currentEmail) =>
        currentEmail || loadedMessages[0]?.email || ""
      );
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

  function formatShortDate(date) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (parsedDate.toDateString() === today.toDateString()) {
      return parsedDate.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    if (parsedDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return parsedDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  const conversations = Object.values(
    messages.reduce((grouped, message) => {
      const key = (message.email || `message-${message.id}`).toLowerCase();

      if (!grouped[key]) {
        grouped[key] = {
          key,
          name: message.name || "Website visitor",
          email: message.email || "",
          messages: [],
        };
      }

      grouped[key].messages.push(message);
      return grouped;
    }, {})
  ).sort((first, second) => {
    const firstDate = new Date(first.messages[0]?.created_at || 0).getTime();
    const secondDate = new Date(second.messages[0]?.created_at || 0).getTime();
    return sortOrder === "newest" ? secondDate - firstDate : firstDate - secondDate;
  });

  const visibleConversations = conversations.filter((conversation) => {
    const query = conversationSearch.trim().toLowerCase();
    return (
      conversation.name.toLowerCase().includes(query) ||
      conversation.email.toLowerCase().includes(query) ||
      conversation.messages.some((message) =>
        (message.message || "").toLowerCase().includes(query)
      )
    );
  });

  const selectedConversation =
    conversations.find((conversation) => conversation.key === selectedEmail) ||
    conversations[0];

  const matchingMessages = selectedConversation
    ? selectedConversation.messages.filter((message) => {
        const query = searchTerm.trim().toLowerCase();
        return (
          !query ||
          selectedConversation.name.toLowerCase().includes(query) ||
          selectedConversation.email.toLowerCase().includes(query) ||
          (message.message || "").toLowerCase().includes(query)
        );
      })
    : [];

  if (loading) {
    return (
      <div className="messages-admin-loading">
        <span aria-hidden="true"></span>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <main className="admin-messages-page">
        <header className="messages-page-header">
          <div className="messages-title">
            <span className="messages-title-icon" aria-hidden="true">▤</span>
            <div>
              <h1>Messages</h1>
              <p>Stay connected with your club community <span aria-hidden="true">♥</span></p>
            </div>
          </div>

          <div className="messages-header-tools">
            <label className="messages-global-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <button type="button" className="messages-notification" onClick={fetchMessages} aria-label="Refresh messages">♢</button>
            <div className="messages-admin-profile">
              <span>A</span><strong>Admin</strong><b>⌄</b>
            </div>
          </div>
        </header>

        {error && (
          <div className="messages-error">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="messages-empty messages-empty-page">
            <span aria-hidden="true">✉</span>
            <h3>No messages yet</h3>
            <p>Messages sent through the Contact page will appear here.</p>
          </div>
        ) : (
          <section className="messages-inbox">
            <aside className="messages-conversations">
              <div className="conversations-heading">
                <div>
                  <h2>Conversations <span>({conversations.length})</span></h2>
                  <p>Contact form inbox</p>
                </div>
                <button type="button" onClick={fetchMessages} aria-label="Refresh conversations">↻</button>
              </div>

              <label className="conversation-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search conversations..."
                  value={conversationSearch}
                  onChange={(event) => setConversationSearch(event.target.value)}
                />
              </label>

              <div className="conversation-filters" aria-label="Sort conversations">
                <button
                  type="button"
                  className={sortOrder === "newest" ? "active" : ""}
                  onClick={() => setSortOrder("newest")}
                >Newest</button>
                <button
                  type="button"
                  className={sortOrder === "oldest" ? "active" : ""}
                  onClick={() => setSortOrder("oldest")}
                >Oldest</button>
              </div>

              <div className="conversation-list">
                {visibleConversations.length === 0 ? (
                  <p className="conversation-no-results">No matching conversations.</p>
                ) : (
                  visibleConversations.map((conversation) => {
                    const latestMessage = conversation.messages[0];
                    return (
                      <button
                        type="button"
                        className={`conversation-item ${selectedConversation?.key === conversation.key ? "active" : ""}`}
                        key={conversation.key}
                        onClick={() => setSelectedEmail(conversation.key)}
                      >
                        <span className="conversation-avatar">
                          {conversation.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="conversation-summary">
                          <span className="conversation-person">
                            <strong>{conversation.name}</strong>
                            <time>{formatShortDate(latestMessage?.created_at)}</time>
                          </span>
                          <span className="conversation-preview">
                            {latestMessage?.message || "No message content"}
                          </span>
                          {conversation.messages.length > 1 && (
                            <span className="conversation-count">
                              {conversation.messages.length} messages
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="messages-thread">
              {selectedConversation ? (
                <>
                  <header className="thread-header">
                    <div className="thread-contact">
                      <span className="conversation-avatar">
                        {selectedConversation.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <h2>{selectedConversation.name}</h2>
                        <a href={`mailto:${selectedConversation.email}`}>
                          {selectedConversation.email || "No email provided"}
                        </a>
                      </div>
                    </div>
                    <a
                      className="thread-reply-button"
                      href={`mailto:${selectedConversation.email}`}
                      aria-label="Reply by email"
                    >↗ <span>Reply by email</span></a>
                  </header>

                  <div className="thread-date-divider">
                    <span>{selectedConversation.messages.length} contact message{selectedConversation.messages.length === 1 ? "" : "s"}</span>
                  </div>

                  <div className="thread-messages">
                    {matchingMessages.length === 0 ? (
                      <p className="thread-no-results">No messages match your search.</p>
                    ) : (
                      matchingMessages.slice().reverse().map((message) => (
                        <article className="thread-message-row" key={message.id}>
                          <span className="thread-message-avatar">
                            {selectedConversation.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="thread-message-wrap">
                            <div className="thread-message-bubble">
                              <p>{message.message}</p>
                            </div>
                            <div className="thread-message-meta">
                              <time>{formatDate(message.created_at)}</time>
                              <button
                                type="button"
                                disabled={deleting === message.id}
                                onClick={() => handleDelete(message.id)}
                                aria-label={`Delete message from ${selectedConversation.name}`}
                              >
                                {deleting === message.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  <footer className="thread-reply-footer">
                    <span>Replies are sent from your email app.</span>
                    <a href={`mailto:${selectedConversation.email}`}>Reply to {selectedConversation.name} <span aria-hidden="true">↗</span></a>
                  </footer>
                </>
              ) : (
                <div className="thread-no-selection">
                  <span aria-hidden="true">✉</span>
                  <h2>Select a conversation</h2>
                  <p>Choose a contact from the list to read their messages.</p>
                </div>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminMessages;
