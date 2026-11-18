
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "./Members.css";

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setError("");
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading members:", error.message);
      setError(error.message);
    } else {
      setMembers(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <section className="members-page">
        <div className="members-state" role="status">
          <span className="members-spinner" aria-hidden="true"></span>
          <p>Loading members...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="members-page">
      <h1>Our Members</h1>
      <p className="members-intro">
        Meet the people behind WebDev Club.
      </p>

      {error && (
        <p className="members-error" role="alert">
          Unable to load members: {error}
        </p>
      )}

      <div className="members-container">
        {members.length === 0 ? (
          <p>No members found yet.</p>
        ) : (
          members.map((member) => (
            <div className="member-card" key={member.id}>
              <div className="member-avatar">
                {member.name.charAt(0).toUpperCase()}
              </div>

              <h2>{member.name}</h2>
              <h4>{member.role}</h4>
              <p>{member.bio}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Members;
