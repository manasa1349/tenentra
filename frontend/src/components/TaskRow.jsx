import api from "../api/api";

export default function TaskRow({ task, onEdit, onDelete, onStatusChange }) {
  const updateStatus = async (status) => {
    await api.patch(`/tasks/${task.id}/status`, { status });
    onStatusChange();
  };

  const remove = async () => {
    if (!window.confirm("Delete task?")) return;
    await api.delete(`/tasks/${task.id}`);
    onDelete();
  };

  return (
    <tr>
      <td>{task.title}</td>
      <td>
        <select
          value={task.status}
          onChange={e => updateStatus(e.target.value)}
        >
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </td>
      <td>{task.priority}</td>
      <td>{task.assignedToName || "User"}</td>
      <td>{task.dueDate ? task.dueDate.split("T")[0] : "-"}</td>
      <td>
        <button onClick={onEdit}>Edit</button>
        <button className="danger" onClick={remove}>Delete</button>
      </td>
    </tr>
  );
}