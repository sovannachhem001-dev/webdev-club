
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SUPABASE_CONFIG_ERROR, supabase } from "../services/supabase";
import AdminSidebar from "./AdminSidebar";
import "./Admin.css";

function Admin() {
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [galleryCount, setGalleryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const membersPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

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

      await fetchAdminData();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function fetchAdminData() {
    try {
      const [memberResult, messageResult] = await Promise.all([
        supabase
          .from("members")
          .select("*")
          .order("id", { ascending: true }),

        supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      const { data: galleryFiles, error: galleryError } =
        await supabase.storage.from("gallery").list("", { limit: 100 });

      if (galleryError) throw galleryError;

      if (memberResult.error) throw memberResult.error;
      if (messageResult.error) throw messageResult.error;

      const updatedMembers = memberResult.data || [];

      setMembers(updatedMembers);
      setMessages(messageResult.data || []);
      setGalleryCount(
        (galleryFiles || []).filter(
          (item) => item.name && item.name !== ".emptyFolderPlaceholder"
        ).length
      );

      const filteredCount = updatedMembers.filter((member) => {
        const search = searchTerm.trim().toLowerCase();

        const matchesSearch =
          (member.name || "").toLowerCase().includes(search) ||
          (member.email || "").toLowerCase().includes(search);

        const matchesRole =
          roleFilter === "All" || member.role === roleFilter;

        return matchesSearch && matchesRole;
      }).length;

      const lastPage = Math.max(
        1,
        Math.ceil(filteredCount / membersPerPage)
      );

      setCurrentPage((page) => Math.min(page, lastPage));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    setName("");
    setRole("");
    setEmail("");
    setBio("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const memberData = {
      name: name.trim(),
      role: role.trim(),
      email: email.trim() || null,
      bio: bio.trim(),
    };

    try {
      let result;

      if (editingId !== null) {
        result = await supabase
          .from("members")
          .update(memberData)
          .eq("id", editingId);
      } else {
        result = await supabase
          .from("members")
          .insert([memberData]);
      }

      if (result.error) throw result.error;

      clearForm();
      setCurrentPage(1);
      await fetchAdminData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(member) {
    setEditingId(member.id);
    setName(member.name);
    setRole(member.role);
    setEmail(member.email || "");
    setBio(member.bio || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteMember(id) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this member?"
    );

    if (!confirmed) return;

    setError("");

    try {
      const { data, error } = await supabase
        .from("members")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Member was not deleted. Check your Supabase permissions."
        );
      }

      if (editingId === id) clearForm();

      await fetchAdminData();
      window.alert("Member permanently deleted!");
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredMembers = members.filter((member) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      (member.name || "").toLowerCase().includes(search) ||
      (member.email || "").toLowerCase().includes(search);

    const matchesRole =
      roleFilter === "All" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(
    filteredMembers.length / membersPerPage
  );

  const startIndex = (currentPage - 1) * membersPerPage;

  const currentMembers = filteredMembers.slice(
    startIndex,
    startIndex + membersPerPage
  );

  const availableRoles = [
    "All",
    ...new Set(
      members.map((member) => member.role).filter(Boolean)
    ),
  ];

  function handleSearch(value) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  function handleRoleFilter(value) {
    setRoleFilter(value);
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="admin-loading-spinner" aria-hidden="true"></span>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <section className="admin-page">
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome to WebDev Club! Manage your community from here.</p>
          </div>

          <div className="admin-header-actions">
            <button
              onClick={() => navigate("/admin/messages")}
              className="admin-notification"
              aria-label="View messages"
            >
              <span aria-hidden="true">🔔</span>
              {messages.length > 0 && <b>{messages.length}</b>}
            </button>
            <button
              onClick={() => navigate("/admin/members")}
              className="admin-profile"
            >
              <span className="admin-profile-avatar">A</span>
              <span><strong>Admin</strong><small>WebDev Club</small></span>
              <span aria-hidden="true">⌄</span>
            </button>
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <section className="admin-welcome-banner">
          <div className="admin-welcome-copy">
            <h2>WebDev Club</h2>
            <p>Learn · Build · Share · Grow</p>
          </div>
          <div className="admin-welcome-message">
            <span>A community for students</span>
            <strong>who love web development, design, and technology.</strong>
          </div>
          <div className="admin-welcome-art" aria-hidden="true">
            <span>&lt;/&gt;</span>
          </div>
        </section>

        <div className="admin-stats">
          <div className="admin-card">
            <span className="admin-stat-icon admin-stat-blue" aria-hidden="true">👥</span>
            <div><p>Total Members</p><h2>{members.length}</h2></div>
          </div>

          <div className="admin-card">
            <span className="admin-stat-icon admin-stat-green" aria-hidden="true">✉</span>
            <div><p>Contact Messages</p><h2>{messages.length}</h2></div>
          </div>

          <div className="admin-card">
            <span className="admin-stat-icon admin-stat-purple" aria-hidden="true">&lt;/&gt;</span>
            <div><p>Gallery Images</p><h2>{galleryCount}</h2></div>
          </div>

          <div className="admin-card">
            <span className="admin-stat-icon admin-stat-orange" aria-hidden="true">◆</span>
            <div><p>Club Roles</p><h2>{availableRoles.length - 1}</h2></div>
          </div>
        </div>

        <div className="admin-analytics">
          <section className="admin-panel admin-growth-panel">
            <div className="admin-panel-heading">
              <h2>Member Growth</h2>
              <div className="admin-period-tabs" aria-label="Chart period">
                <button className="active" type="button">Monthly</button>
                <button type="button">Weekly</button>
                <button type="button">Yearly</button>
              </div>
            </div>
            <div className="admin-growth-chart" aria-label="Recent member growth chart">
              {[22, 38, 46, 58, 72, 86].map((height, index) => (
                <div className="admin-chart-column" key={index}>
                  <div
                    className="admin-chart-bar"
                    style={{ height: `${height}%` }}
                    title={`${height} members`}
                  ></div>
                  <span>{["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][index]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel admin-role-panel">
            <div className="admin-panel-heading">
              <h2>Members by Role</h2>
            </div>
            <div className="admin-role-content">
              <div className="admin-role-donut">
                <div><strong>{members.length}</strong><span>Members</span></div>
              </div>
              <div className="admin-role-list">
                {availableRoles.slice(1, 4).length > 0
                  ? availableRoles.slice(1, 4).map((role, index) => {
                      const count = members.filter((member) => member.role === role).length;
                      return (
                        <div key={role}>
                          <span className={`admin-role-dot role-${index}`}></span>
                          <p>{role}</p>
                          <strong>{count}</strong>
                        </div>
                      );
                    })
                  : <p>No roles added yet</p>}
              </div>
            </div>
          </section>
        </div>

        <section className="admin-panel admin-quick-actions">
          <div className="admin-panel-heading">
            <h2>Quick Actions</h2>
          </div>
          <div className="admin-actions-grid">
            <button type="button" onClick={() => document.querySelector(".member-form")?.scrollIntoView({ behavior: "smooth" })}>
              <span className="admin-action-purple">＋</span>Add Member
            </button>
            <button type="button" onClick={() => navigate("/admin/messages")}>
              <span className="admin-action-green">✉</span>View Messages
            </button>
            <button type="button" onClick={() => navigate("/admin/gallery")}>
              <span className="admin-action-orange">▧</span>Upload Gallery
            </button>
          </div>
        </section>

        <h2>
          {editingId !== null ? "Edit Member" : "Add New Member"}
        </h2>

        <form className="member-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Member name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Member role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Member email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <textarea
            placeholder="Member bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Update Member"
                : "Add Member"}
          </button>

          {editingId !== null && (
            <button type="button" onClick={clearForm}>
              Cancel Edit
            </button>
          )}
        </form>

        <h2 id="members">Manage Members</h2>

        <div className="member-search">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />

          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilter(e.target.value)}
          >
            {availableRoles.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Roles" : item}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-table">
          {currentMembers.length === 0 ? (
            <p className="no-members">No matching members found.</p>
          ) : (
            currentMembers.map((member) => (
              <div className="admin-row" key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.role}</p>
                  <p>{member.email}</p>
                  <p>{member.bio}</p>
                </div>

                <div className="member-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(member)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                className={
                  currentPage === index + 1 ? "active-page" : ""
                }
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {filteredMembers.length > 0 && (
          <p className="pagination-info">
            Showing {startIndex + 1}–
            {Math.min(
              startIndex + membersPerPage,
              filteredMembers.length
            )}{" "}
            of {filteredMembers.length} members
          </p>
        )}

        <h2>Contact Messages</h2>

        <div className="admin-messages">
          {messages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            messages.map((message) => (
              <div className="admin-message" key={message.id}>
                <h3>{message.name}</h3>
                <p>{message.email}</p>
                <p>{message.message}</p>
                <small>
                  {new Date(message.created_at).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Admin;
