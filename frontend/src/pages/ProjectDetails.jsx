import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import TaskModal from "../components/TaskModal";
import TaskRow from "../components/TaskRow";
import "../styles/projectDetails.css";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadData = async () => {
    try {
      const projectRes = await api.get(`/projects/${projectId}`);
      const tasksRes = await api.get(`/projects/${projectId}/tasks`);

      const projectData =
        projectRes.data.data.project || projectRes.data.data;

      setProject(projectData);
      setTasks(tasksRes.data.data.tasks);
    } catch (err) {
      alert("Failed to load project");
      navigate("/projects");
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleDeleteProject = async () => {
    if (!window.confirm("Delete this project?")) return;
    await api.delete(`/projects/${projectId}`);
    navigate("/projects");
  };

  const filteredTasks = filter
    ? tasks.filter(t => t.status === filter)
    : tasks;

  if (!project) return <p className="page">Loading...</p>;

  return (
    <div className="project-details">
      <div className="project-header">
        <div>
          <h1>{project.name}</h1>
          <p>{project.description || "No description"}</p>
        </div>

        <div className="project-actions">
          <span className={`badge ${project.status || "active"}`}>
            {project.status || "active"}
          </span>
          {/* <span className={`badge ${project.status}`}>{project.status}</span> */}
          <button className="danger" onClick={handleDeleteProject}>
            Delete Project
          </button>
          <button onClick={() => alert("Edit project coming soon")}>
            Edit Project
          </button>

        </div>
      </div>

      <div className="tasks-header">
        <h2>Tasks</h2>
        <div className="tasks-controls">
          <select onChange={e => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
            + Add Task
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 && <p>No tasks found.</p>}

      <table className="tasks-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assigned</th>
            <th>Due</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={() => { setEditingTask(task); setShowTaskModal(true); }}
              onDelete={loadData}
              onStatusChange={loadData}
            />
          ))}
        </tbody>
      </table>

      {showTaskModal && (
        <TaskModal
          projectId={projectId}
          task={editingTask}
          onClose={() => setShowTaskModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}