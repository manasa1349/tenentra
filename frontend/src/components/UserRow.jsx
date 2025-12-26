export default function UserRow({ user, onEdit, onDeleted }) {
  const handleDelete = async () => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await api.delete(`/users/${user.id}`);
      onDeleted();
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete user");
    }
  };

  return (
    <tr>
      <td>{user.full_name}</td>
      <td>{user.email}</td>
      <td>
        <span className={`badge ${user.role}`}>
          {user.role}
        </span>
      </td>
      <td>{user.is_active ? "Active" : "Inactive"}</td>
      <td>
        {user.created_at
          ? user.created_at.split("T")[0]
          : "-"}
      </td>
      <td>
        <button onClick={onEdit}>Edit</button>
        <button className="danger" onClick={handleDelete}>
          Delete
        </button>
      </td>
    </tr>
  );
}