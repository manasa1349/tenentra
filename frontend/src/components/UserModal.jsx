import { useState } from 'react';
import api from '../api/api';
import '../styles/modal.css';

export default function UserModal({ user, tenantId, onClose, onSaved }) {
  const isEdit = !!user;

  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'user');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || (!isEdit && !password)) {
      setError('Please fill all required fields');
      return;
    }

    if (!isEdit && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/users/${user.id}`, {
          fullName: fullName.trim(),
          role,
          isActive,
        });
      } else {
        await api.post(`/tenants/${tenantId}/users`, {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          password,
          role,
        });
      }

      await onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='modal-backdrop'>
      <div className='modal'>
        <h2>{isEdit ? 'Edit User' : 'Add User'}</h2>

        {error && <p className='error'>{error}</p>}

        <form onSubmit={submit}>
          <label htmlFor='fullName'>Full Name</label>
          <input id='fullName' value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label htmlFor='email'>Email</label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEdit}
          />

          {!isEdit && (
            <>
              <label htmlFor='password'>Password</label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}

          <label htmlFor='role'>Role</label>
          <select id='role' value={role} onChange={(e) => setRole(e.target.value)}>
            <option value='user'>User</option>
            <option value='tenant_admin'>Tenant Admin</option>
          </select>

          {isEdit && (
            <label className='checkbox'>
              <input
                type='checkbox'
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
          )}

          <div className='modal-actions'>
            <button type='button' onClick={onClose}>
              Cancel
            </button>
            <button disabled={saving}>{saving ? 'Saving...' : 'Save User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
