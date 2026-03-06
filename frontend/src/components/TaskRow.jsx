import api from '../api/api';

export default function TaskRow({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  canEdit = true,
  canDelete = true,
  canChangeStatus = true,
}) {
  const updateStatus = async (status) => {
    if (!canChangeStatus) return;
    await api.patch(`/tasks/${task.id}/status`, { status });
    await onStatusChange();
  };

  const remove = async () => {
    if (!canDelete) return;
    if (!window.confirm('Delete task?')) return;
    await api.delete(`/tasks/${task.id}`);
    await onDelete();
  };

  return (
    <tr>
      <td>{task.title}</td>
      <td>
        <select
          value={task.status}
          onChange={(e) => updateStatus(e.target.value)}
          disabled={!canChangeStatus}
        >
          <option value='todo'>Todo</option>
          <option value='in_progress'>In Progress</option>
          <option value='completed'>Completed</option>
        </select>
      </td>
      <td>
        <span className={`badge ${task.priority}`}>{task.priority}</span>
      </td>
      <td>{task.assignedTo?.fullName || 'Unassigned'}</td>
      <td>{task.dueDate ? String(task.dueDate).split('T')[0] : '-'}</td>
      <td>
        <div className='inline-actions'>
          {canEdit && <button onClick={onEdit}>Edit</button>}
          {canDelete && (
            <button className='danger' onClick={remove}>
              Delete
            </button>
          )}
          {!canEdit && !canDelete && <span className='muted'>No actions</span>}
        </div>
      </td>
    </tr>
  );
}
