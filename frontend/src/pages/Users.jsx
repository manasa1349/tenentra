import { useEffect, useState } from "react";
import api from "../api/api";
import UserModal from "../components/UserModal";
import UserRow from "../components/UserRow";
import "../styles/users.css";
import { useAuth } from "../auth/AuthContext";

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  if (user?.role !== "tenant_admin") {
    return <p>Access denied</p>;
  }

  const loadUsers = async () => {
    try {
      const meRes = await api.get("/auth/me");
      const tenantId = meRes.data.data.tenantId;

      if (!tenantId) return;

      const res = await api.get(`/tenants/${tenantId}/users`);
      setUsers(res.data.data.users);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(u => {
    return (
      (!search ||
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())) &&
      (!roleFilter || u.role === roleFilter)
    );
  });

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Users</h1>
        <button onClick={() => { setEditingUser(null); setShowModal(true); }}>
          + Add User
        </button>
      </div>

      <div className="users-filters">
        <input
          placeholder="Search by name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="tenant_admin">Tenant Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {filtered.length === 0 && <p>No users found.</p>}

      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(user => (
            <UserRow
              key={user.id}
              user={user}
              onEdit={() => { setEditingUser(user); setShowModal(true); }}
              onDeleted={loadUsers}
            />
          ))}
        </tbody>
      </table>

      {showModal && (
        <UserModal
          user={editingUser}
          tenantId={users[0]?.tenant_id || null}
          onSaved={loadUsers}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}