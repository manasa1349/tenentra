// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <span className="logo">MultiTenant SaaS</span>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/tasks">Tasks</Link>
        {user.role === "tenant_admin" && <Link to="/users">Users</Link>}
      </div>

      <div className="nav-right">
        <span className="user">
          {user.fullName} ({user.role})
        </span>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}