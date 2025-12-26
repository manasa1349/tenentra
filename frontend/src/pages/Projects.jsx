import { useEffect, useState } from "react";
import api from "../api/api";
import ProjectModal from "../components/ProjectModal";
import "../styles/projects.css";
import { useNavigate } from "react-router-dom";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const loadProjects = async () => {
    const res = await api.get("/projects");
    setProjects(res.data.data.projects);
    setFiltered(res.data.data.projects);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    let data = [...projects];
    if (search) {
      data = data.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) {
      data = data.filter(p => p.status === status);
    }
    setFiltered(data);
  }, [search, status, projects]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    await api.delete(`/projects/${id}`);
    loadProjects();
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>Projects</h1>
        <button onClick={() => { setEditing(null); setShowModal(true); }}>
          + New Project
        </button>
      </div>

      <div className="projects-filters">
        <input
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filtered.length === 0 && <p>No projects found.</p>}

      <div className="projects-grid">
        {filtered.map(p => (
          <div className="project-card" key={p.id}>
            <div>
              <h3>{p.name}</h3>
              <p>{p.description || "No description"}</p>
            </div>

            <div className="project-meta">
              <span className={`badge ${p.status}`}>{p.status}</span>
              <div className="actions">
                <button onClick={() => navigate(`/projects/${p.id}`)}>
                  View
                </button>
                <button onClick={() => { setEditing(p); setShowModal(true); }}>
                  Edit
                </button>
                <button className="danger" onClick={() => handleDelete(p.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ProjectModal
          project={editing}
          onClose={() => setShowModal(false)}
          onSaved={loadProjects}
        />
      )}
    </div>
  );
}