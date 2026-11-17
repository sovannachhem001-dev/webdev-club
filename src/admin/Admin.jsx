
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import AdminSidebar from "./AdminSidebar";
import "./Admin.css";

function Admin() {
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
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

      if (memberResult.error) throw memberResult.error;
      if (messageResult.error) throw messageResult.error;

      const updatedMembers = memberResult.data || [];

      setMembers(updatedMembers);
      setMessages(messageResult.data || []);

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
    return <p>Checking admin access...</p>;
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <section className="admin-page">
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome to WebDev Club management.</p>
          </div>

          <div className="admin-header-actions">
            <button
              onClick={() => navigate("/admin/messages")}
              className="manage-messages-btn"
            >
              Manage Messages
            </button>
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-stats">
          <div className="admin-card">
            <h2>{members.length}</h2>
            <p>Total Members</p>
          </div>

          <div className="admin-card">
            <h2>{messages.length}</h2>
            <p>Contact Messages</p>
          </div>
        </div>

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
