
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
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
  const [currentPage, setCurrentPage] = useState(1);

  const membersPerPage = 5;

  useEffect(() => {
    checkAdmin();
  }, []);

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
    return <p>Checking admin access...</p>;
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <main className="admin-members-page">
        <header className="members-header">
          <div>
            <h1>Manage Members</h1>
            <p>Manage all WebDev Club members here.</p>
          </div>

          <div className="members-total">
            <span>Total Members</span>
            <strong>{members.length}</strong>
          </div>
        </header>

        {error && <p className="members-error">{error}</p>}

        <section className="members-form-section">
          <h2>
            {editingId !== null ? "Edit Member" : "Add New Member"}
          </h2>

          <form className="members-form" onSubmit={handleSubmit}>
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

            <div className="members-form-actions">
              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Member"
                    : "Add Member"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="cancel-member-btn"
                  onClick={clearForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="members-list-section">
          <div className="members-list-header">
            <h2>All Members</h2>

            <div className="members-filters">
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />

              <select
                value={roleFilter}
                onChange={(e) => handleFilter(e.target.value)}
              >
                {availableRoles.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Roles" : item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="members-list">
            {currentMembers.length === 0 ? (
              <p className="members-empty">
                No matching members found.
              </p>
            ) : (
              currentMembers.map((member) => (
                <article className="member-item" key={member.id}>
                  <div className="member-info">
                    <h3>{member.name}</h3>
                    <span className="member-role">{member.role}</span>
                    <p>{member.email || "No email provided"}</p>
                    <p>{member.bio || "No bio provided"}</p>
                  </div>

                  <div className="member-item-actions">
                    <button
                      className="member-edit-btn"
                      onClick={() => handleEdit(member)}
                    >
                      Edit
                    </button>

                    <button
                      className="member-delete-btn"
                      onClick={() => handleDelete(member.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
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
      </main>
    </div>
  );
}

export default AdminMembers;
