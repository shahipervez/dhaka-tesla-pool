import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="shell">
      <header className="nav">
        <NavLink to="/" className="brand">
          <span className="brand-mark">DTP</span>
          <span>
            <strong>Dhaka Tesla Pool</strong>
            <small>Share a seat. Split the fare.</small>
          </span>
        </NavLink>
        {user && (
          <div className="nav-user">
            <span className="role-pill">{user.role}</span>
            <span>{user.name}</span>
            <button className="btn ghost small" onClick={onLogout}>Sign out</button>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="footer">
        Fictional internship challenge MVP · no affiliation with Tesla, Inc.
      </footer>
    </div>
  );
}
