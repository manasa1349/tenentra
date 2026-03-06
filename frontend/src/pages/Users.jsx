import { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import UserModal from '../components/UserModal';
import UserRow from '../components/UserRow';
import '../styles/users.css';
import '../styles/layout.css';
import { useAuth } from '../auth/AuthContext';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const tenantId = user?.tenant?.id;
  const hasAccess = user?.role === 'tenant_admin';

  const loadUsers = useCallback(
    async (nextPage = page, nextSearch = search, nextRole = roleFilter) => {
      if (!tenantId) return;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(nextPage));
        params.set('limit', '25');
        if (nextSearch.trim()) params.set('search', nextSearch.trim());
        if (nextRole) params.set('role', nextRole);

        const res = await api.get(`/tenants/${tenantId}/users?${params.toString()}`);
        setUsers(res.data.data.users || []);
        setPagination(res.data.data.pagination || null);
        setPage(nextPage);
      } finally {
        setLoading(false);
      }
    },
    [page, roleFilter, search, tenantId]
  );

  useEffect(() => {
    if (hasAccess) {
      loadUsers(1, search, roleFilter);
    }
  }, [roleFilter, hasAccess, loadUsers, search]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(1, search, roleFilter);
  };

  if (!hasAccess) {
    return <div className='page'><p>Access denied</p></div>;
  }

  return (
    <div className='page users-page'>
      <div className='page-header users-header'>
        <h1>Users</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
        >
          + Add User
        </button>
      </div>

      <form className='toolbar' onSubmit={onSearchSubmit}>
        <input
          placeholder='Search by name or email'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value=''>All Roles</option>
          <option value='tenant_admin'>Tenant Admin</option>
          <option value='user'>User</option>
        </select>

        <button type='submit'>Apply</button>
      </form>

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className='table-wrap'>
          <table className='data-table users-table'>
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
              {users.map((entry) => (
                <UserRow
                  key={entry.id}
                  user={entry}
                  onEdit={() => {
                    setEditingUser(entry);
                    setShowModal(true);
                  }}
                  onDeleted={() => loadUsers(page, search, roleFilter)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <div className='pager'>
          <button disabled={page <= 1} onClick={() => loadUsers(page - 1, search, roleFilter)}>
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => loadUsers(page + 1, search, roleFilter)}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <UserModal
          user={editingUser}
          tenantId={tenantId}
          onSaved={() => loadUsers(page, search, roleFilter)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
