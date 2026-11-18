
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SUPABASE_CONFIG_ERROR, supabase } from "../services/supabase";
import AdminSidebar from "./AdminSidebar";
import "./AdminMembers.css";

function AdminMembers() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
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
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const membersPerPage = 5;

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

      await fetchMembers();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      setMembers(data || []);
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
    setShowMemberForm(false);
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
      await fetchMembers();
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
    setShowMemberForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this member?"
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
        throw new Error("Member was not deleted. Check your permissions.");
      }

      if (editingId === id) clearForm();

      await fetchMembers();
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

    const memberStatus = member.status || "Active";
    const matchesStatus =
      statusFilter === "All" || memberStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
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
    ...new Set(members.map((member) => member.role).filter(Boolean)),
  ];

  function handleSearch(value) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  function handleFilter(value) {
    setRoleFilter(value);
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="members-admin-loading">
        <span aria-hidden="true"></span>
        <p>Loading members...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <main className="admin-members-page">
        <header className="members-header">
          <div>
            <h1>Members</h1>
            <p>Manage club members (view, add, edit, delete)</p>
          </div>

          <div className="members-header-tools">
            <label className="members-top-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search member..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="members-bell"
              onClick={() => navigate("/admin/messages")}
              aria-label="Open messages"
            >
              ♢
            </button>
            <button type="button" className="members-profile">
              <span>A</span>
              <strong>Admin</strong>
              <b>⌄</b>
            </button>
          </div>
        </header>

        {error && <p className="members-error">{error}</p>}

        <section className="members-stat-grid">
          <article className="members-stat-card">
            <span className="members-stat-icon purple">♟</span>
            <div><p>Total Members</p><strong>{members.length}</strong></div>
          </article>
          <article className="members-stat-card">
            <span className="members-stat-icon blue">▱</span>
            <div><p>Students</p><strong>{members.filter((member) => /student/i.test(member.role || "")).length}</strong></div>
          </article>
          <article className="members-stat-card">
            <span className="members-stat-icon orange">★</span>
            <div><p>Core Team</p><strong>{members.filter((member) => /core/i.test(member.role || "")).length}</strong></div>
          </article>
          <article className="members-stat-card">
            <span className="members-stat-icon violet">♟</span>
            <div><p>Advisors</p><strong>{members.filter((member) => /advisor/i.test(member.role || "")).length}</strong></div>
          </article>
          <button
            type="button"
            className="members-add-button"
            onClick={() => {
              clearForm();
              setShowMemberForm(true);
            }}
          >
            ＋ Add Member
          </button>
        </section>

        <section className="members-list-section">
          <div className="members-list-header">
            <div className="members-list-title">
              <span>♟</span>
              <h2>Member List</h2>
            </div>

            <div className="members-filters">
              <select
                value={roleFilter}
                onChange={(e) => handleFilter(e.target.value)}
                aria-label="Filter by role"
              >
                {availableRoles.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Roles" : item}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by status"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
              </select>
              <div className="members-view-toggle">
                <button
                  type="button"
                  className={viewMode === "list" ? "active" : ""}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >≡</button>
                <button
                  type="button"
                  className={viewMode === "grid" ? "active" : ""}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >▦</button>
              </div>
            </div>
          </div>

          <div className={`members-table ${viewMode === "grid" ? "members-table-grid" : ""}`}>
            {viewMode === "list" && (
              <div className="members-table-head">
                <span>#</span>
                <span>Photo</span>
                <span>Name</span>
                <span>Role</span>
                <span>Email</span>
                <span>Joined Date</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
            )}

            {currentMembers.length === 0 ? (
              <p className="members-empty">No matching members found.</p>
            ) : (
              currentMembers.map((member, index) => {
                const status = member.status || "Active";
                const joinedDate = member.created_at
                  ? new Date(member.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : "Not available";

                return (
                  <article className="member-item" key={member.id}>
                    {viewMode === "list" && (
                      <span className="member-index">{startIndex + index + 1}</span>
                    )}
                    <span className="member-avatar">
                      {(member.name || "?").charAt(0).toUpperCase()}
                    </span>
                    <strong className="member-name">{member.name}</strong>
                    <span className={`member-role role-${(member.role || "").toLowerCase().replace(/\s+/g, "-")}`}>
                      {member.role}
                    </span>
                    <span className="member-email">{member.email || "No email"}</span>
                    <span className="member-date">{joinedDate}</span>
                    <span className={`member-status ${status === "Pending" ? "pending" : "active"}`}>
                      <i></i>{status}
                    </span>
                    <div className="member-item-actions">
                      <button
                        className="member-edit-btn"
                        onClick={() => handleEdit(member)}
                        aria-label={`Edit ${member.name}`}
                      >✎</button>
                      <button
                        className="member-delete-btn"
                        onClick={() => handleDelete(member.id)}
                        aria-label={`Delete ${member.name}`}
                      >🗑</button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="members-pagination">
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  className={
                    currentPage === index + 1 ? "active" : ""
                  }
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
              >
                Next
              </button>
            </div>
          )}

          {filteredMembers.length > 0 && (
            <p className="members-pagination-info">
              Showing {startIndex + 1}–
              {Math.min(
                startIndex + membersPerPage,
                filteredMembers.length
              )}{" "}
              of {filteredMembers.length} members
            </p>
          )}
        </section>

        {showMemberForm && (
          <div
            className="members-modal-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) clearForm();
            }}
          >
            <section
              className="members-form-section members-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="member-form-title"
            >
              <div className="members-modal-heading">
                <div>
                  <h2 id="member-form-title">
                    {editingId !== null ? "Edit Member" : "Add New Member"}
                  </h2>
                  <p>Manage the member profile shown on the public website.</p>
                </div>
                <button type="button" onClick={clearForm} aria-label="Close member form">×</button>
              </div>

              <form className="members-form" onSubmit={handleSubmit}>
                <div className="members-form-grid">
                  <label>
                    <span>Name</span>
                    <input
                      type="text"
                      placeholder="Member name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    <span>Role</span>
                    <input
                      type="text"
                      placeholder="Student, Core Team, Advisor..."
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    placeholder="Member email (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label>
                  <span>Bio</span>
                  <textarea
                    placeholder="Short member bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </label>

                <div className="members-form-actions">
                  <button type="submit" disabled={saving}>
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Member"
                        : "Add Member"}
                  </button>
                  <button
                    type="button"
                    className="cancel-member-btn"
                    onClick={clearForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminMembers;
