import api from '../api/api';

export default function UserRow({ user, onEdit, onDeleted }) {
  const handleDelete = async () => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await api.delete(`/users/${user.id}`);
      onDeleted();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete user');
    }
  };

  return (
    <tr>
      <td>{user.fullName}</td>
      <td>{user.email}</td>
      <td>
        <span className={`badge ${user.role}`}>{user.role}</span>
      </td>
      <td>{user.isActive ? 'Active' : 'Inactive'}</td>
      <td>{user.createdAt ? String(user.createdAt).split('T')[0] : '-'}</td>
      <td>
        <div className='inline-actions'>
          <button onClick={onEdit}>Edit</button>
          <button className='danger' onClick={handleDelete}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
