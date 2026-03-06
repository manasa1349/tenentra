import { useEffect, useState } from 'react';
import api from '../api/api';
import '../styles/modal.css';

export default function TaskModal({ projectId, task, onClose, onSaved }) {
  const isEdit = !!task;

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignedTo: task?.assignedTo?.id || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });

  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const meRes = await api.get('/auth/me');
        const tenantId = meRes.data.data.tenant?.id;
        if (!tenantId) return;

        const usersRes = await api.get(`/tenants/${tenantId}/users?limit=100`);
        setUsers(usersRes.data.data.users || []);
      } catch {
        setUsers([]);
      }
    };

    loadUsers();
  }, []);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Task title is required');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || null,
      };

      if (isEdit) {
        await api.put(`/tasks/${task.id}`, payload);
      } else {
        await api.post(`/projects/${projectId}/tasks`, {
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          assignedTo: payload.assignedTo,
          dueDate: payload.dueDate,
        });
      }

      await onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='modal-backdrop'>
      <div className='modal'>
        <h2>{isEdit ? 'Edit Task' : 'Create Task'}</h2>

        {error && <p className='error'>{error}</p>}

        <form onSubmit={submit}>
          <label htmlFor='taskTitle'>Title</label>
          <input
            id='taskTitle'
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
          />

          <label htmlFor='taskDescription'>Description</label>
          <textarea
            id='taskDescription'
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
          />

          {isEdit && (
            <>
              <label htmlFor='taskStatus'>Status</label>
              <select
                id='taskStatus'
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
              >
                <option value='todo'>Todo</option>
                <option value='in_progress'>In Progress</option>
                <option value='completed'>Completed</option>
              </select>
            </>
          )}

          <label htmlFor='taskPriority'>Priority</label>
          <select
            id='taskPriority'
            value={form.priority}
            onChange={(e) => updateField('priority', e.target.value)}
          >
            <option value='low'>Low</option>
            <option value='medium'>Medium</option>
            <option value='high'>High</option>
          </select>

          <label htmlFor='taskAssignedTo'>Assign To</label>
          <select
            id='taskAssignedTo'
            value={form.assignedTo}
            onChange={(e) => updateField('assignedTo', e.target.value)}
          >
            <option value=''>Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.email})
              </option>
            ))}
          </select>

          <label htmlFor='taskDueDate'>Due Date</label>
          <input
            id='taskDueDate'
            type='date'
            value={form.dueDate}
            onChange={(e) => updateField('dueDate', e.target.value)}
          />

          <div className='modal-actions'>
            <button type='button' onClick={onClose}>
              Cancel
            </button>
            <button disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
