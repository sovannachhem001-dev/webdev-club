
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./AdminSidebar.css";

function AdminSidebar() {
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-mark" aria-hidden="true">&lt;/&gt;</span>
        <div>
          <h2>WebDev Club</h2>
          <p>IT &amp; Web Development</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span>▦</span> Dashboard
        </NavLink>

        <NavLink
          to="/admin/members"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span>♙</span> Members
        </NavLink>

        <NavLink
          to="/admin/gallery"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span>▧</span> Gallery
        </NavLink>

        <NavLink
          to="/admin/messages"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span>✉</span> Messages
        </NavLink>
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}

export default AdminSidebar;
