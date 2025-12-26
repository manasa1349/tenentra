import { useState } from "react";
import api from "../api/api";
import "../styles/modal.css";

export default function ProjectModal({ project, onClose, onSaved }) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [status, setStatus] = useState(project?.status || "active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (project) {
        await api.put(`/projects/${project.id}`, {
          name,
          description,
          status,
        });
      } else {
        await api.post("/projects", {
          name,
          description,
        });
      }
      onSaved();
      onClose();
    } catch {
      setError("Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{project ? "Edit Project" : "New Project"}</h2>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Project Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />

          <label>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          {project && (
            <>
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}