import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/layout.css";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        // get current user
        const meRes = await api.get("/auth/me");
        const userId = meRes.data.data.id;

        // get all projects
        const projectsRes = await api.get("/projects");
        const projects = projectsRes.data.data.projects;

        let allTasks = [];

        // fetch tasks per project (backend design)
        for (const project of projects) {
          const res = await api.get(
            `/projects/${project.id}/tasks?assignedTo=${userId}`
          );

          const projectTasks = res.data.data.tasks.map(t => ({
            ...t,
            projectName: project.name,
          }));

          allTasks = allTasks.concat(projectTasks);
        }

        setTasks(allTasks);
      } catch (err) {
        console.error("Failed to load tasks", err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  if (loading) return <p className="page">Loading tasks...</p>;

  return (
    <div className="page">
      <h1>My Tasks</h1>

      {tasks.length === 0 && <p>No tasks assigned.</p>}

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Project</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.projectName}</td>
              <td>{task.status}</td>
              <td>{task.priority}</td>
              <td>{task.dueDate ? task.dueDate.split("T")[0] : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}