import { useState } from "react";
import api from "../api/api";
import "../styles/tasks.css";
import { useEffect } from "react";

export default function TaskModal({ projectId, task, onClose, onSaved }) {
  const [title, setTitle] = useState(task?.title || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate?.split("T")[0] || "");
  const [error, setError] = useState("");
  const [assignedToName,setAssignedTo]=useState(task?.assignedTo||"user1");
  const [users, setUsers] = useState([]);
  useEffect(() => {
  const loadUsers = async () => {
    try {
      const res = await api.get("/users"); 
      setUsers(res.data.data.users);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  loadUsers();
}, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title required");
      return;
    }

    if (task) {
      await api.put(`/tasks/${task.id}`, { title, priority, dueDate });
    } else {
      await api.post(`/projects/${projectId}/tasks`, {
        title,
        priority,
        assignedToName,
        dueDate,
      });
    }

    onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{task ? "Edit Task" : "New Task"}</h2>

        {error && <p className="error">{error}</p>}

        <form onSubmit={submit}>
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} />

          <label>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <label>Assign To</label>
          <select
            value={assignedToName}
            onChange={e => setAssignedTo(e.target.value)}
          >
            <option value="">Unassigned</option>
            <option value="">user</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
          <label>Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
