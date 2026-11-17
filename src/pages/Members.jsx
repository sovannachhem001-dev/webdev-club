
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "./Members.css";

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading members:", error.message);
    } else {
      setMembers(data);
    }

    setLoading(false);
  }

  if (loading) {
    return <p>Loading members...</p>;
  }

  return (
    <section className="members-page">
      <h1>Our Members</h1>
      <p className="members-intro">
        Meet the people behind WebDev Club.
      </p>

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
