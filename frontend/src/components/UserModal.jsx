import { useState } from "react";
import api from "../api/api";

export default function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user;

  const [email, setEmail] = useState(user?.email || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role || "user");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    if (!fullName || !email || (!isEdit && !password)) {
      setError("All required fields must be filled");
      return;
    }

    if (isEdit) {
      await api.put(`/users/${user.id}`, {
        fullName,
        role,
        isActive,
      });
    } else {
      const me = await api.get("/auth/me");
      const tenantId = me.data.data.tenant.id;

      await api.post(`/tenants/${tenantId}/users`, {
        email,
        fullName,
        password,
        role,
      });
      
      onSaved();
      onClose();
    }

    // onSaved();
    // onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{isEdit ? "Edit User" : "Add User"}</h2>

        {error && <p className="error">{error}</p>}

        <form onSubmit={submit}>
          <label>Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} />

          <label>Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isEdit}
          />

          {!isEdit && (
            <>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </>
          )}

          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="tenant_admin">Tenant Admin</option>
          </select>

          {isEdit && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
              />
              Active
            </label>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}