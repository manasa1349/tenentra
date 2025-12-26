import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // current user
        const meRes = await api.get("/auth/me");
        const userId = meRes.data.data.id;

        // projects
        const projectsRes = await api.get("/projects");
        const projects = projectsRes.data.data.projects || [];

        let allTasks = [];
        let assignedTasks = [];

        for (const project of projects) {
          const taskRes = await api.get(`/projects/${project.id}/tasks`);
          const tasks = taskRes.data.data.tasks || [];

          allTasks = allTasks.concat(tasks);

          assignedTasks = assignedTasks.concat(
            tasks
              .filter(t => t.assigned_to === userId)
              .map(t => ({
                ...t,
                projectName: project.name,
              }))
          );
        }

        setStats({
          projects: projects.length,
          totalTasks: allTasks.length,
          completedTasks: allTasks.filter(t => t.status === "completed").length,
          pendingTasks: allTasks.filter(t => t.status !== "completed").length,
        });

        setRecentProjects(projects.slice(0, 5));
        setMyTasks(assignedTasks.slice(0, 5));
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <div className="page">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* ===== STATS ===== */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Projects</h3>
          <p>{stats.projects}</p>
        </div>
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p>{stats.totalTasks}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p>{stats.completedTasks}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p>{stats.pendingTasks}</p>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="dashboard-grid">
        {/* Recent Projects */}
        <div className="card">
          <h2>Recent Projects</h2>

          {recentProjects.length === 0 && <p>No projects yet.</p>}

          <ul className="list">
            {recentProjects.map(p => (
              <li key={p.id}>
                <strong>{p.name}</strong>
                <span className={`badge ${p.status}`}>
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* My Tasks */}
        <div className="card">
          <h2>My Tasks</h2>

          {myTasks.length === 0 && <p>No tasks assigned.</p>}

          <ul className="list">
            {myTasks.map(t => (
              <li key={t.id}>
                <div>
                  <strong>{t.title}</strong>
                  <small>{t.projectName}</small>
                </div>
                <span className={`badge ${t.priority}`}>
                  {t.priority}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}