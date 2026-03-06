import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import '../styles/dashboard.css';
import PageLoader from '../components/PageLoader';

export default function Dashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [myTaskStatusFilter, setMyTaskStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const meRes = await api.get('/auth/me');
        const currentUser = meRes.data.data;
        const userId = currentUser.id;

        const projectsRes = await api.get('/projects?limit=100');
        const projects = projectsRes.data.data.projects || [];

        const taskResponses = await Promise.all(
          projects.map((project) =>
            api
              .get(`/projects/${project.id}/tasks?limit=100`)
              .then((res) => ({ project, tasks: res.data.data.tasks || [] }))
              .catch(() => ({ project, tasks: [] }))
          )
        );

        const allTasks = taskResponses.flatMap((entry) => entry.tasks);
        const assignedTasks = taskResponses.flatMap((entry) =>
          entry.tasks
            .filter((task) => task.assignedTo?.id === userId)
            .map((task) => ({ ...task, projectName: entry.project.name, projectId: entry.project.id }))
        );

        setStats({
          projects: projects.length,
          totalTasks: allTasks.length,
          completedTasks: allTasks.filter((task) => task.status === 'completed').length,
          pendingTasks: allTasks.filter((task) => task.status !== 'completed').length,
        });

        setRecentProjects(projects.slice(0, 5));
        setMyTasks(assignedTasks);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const filteredMyTasks = useMemo(() => {
    if (!myTaskStatusFilter) return myTasks;
    return myTasks.filter((task) => task.status === myTaskStatusFilter);
  }, [myTasks, myTaskStatusFilter]);

  if (loading) return <PageLoader text='Loading dashboard...' />;

  return (
    <div className='page dashboard'>
      <div className='page-header'>
        <h1>Dashboard</h1>
      </div>

      <div className='stats-grid'>
        <article className='stat-card'>
          <h3>Total Projects</h3>
          <p>{stats.projects}</p>
        </article>
        <article className='stat-card'>
          <h3>Total Tasks</h3>
          <p>{stats.totalTasks}</p>
        </article>
        <article className='stat-card'>
          <h3>Completed Tasks</h3>
          <p>{stats.completedTasks}</p>
        </article>
        <article className='stat-card'>
          <h3>Pending Tasks</h3>
          <p>{stats.pendingTasks}</p>
        </article>
      </div>

      <div className='dashboard-grid'>
        <section className='card'>
          <h2>Recent Projects</h2>
          {recentProjects.length === 0 ? (
            <p className='muted'>No projects yet.</p>
          ) : (
            <ul className='list'>
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <div>
                    <strong>{project.name}</strong>
                    <small>
                      {project.taskCount} tasks  {project.completedTaskCount} completed
                    </small>
                  </div>
                  <div className='inline-actions'>
                    <span className={`badge ${project.status}`}>{project.status}</span>
                    <Link to={`/projects/${project.id}`} className='text-link'>
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className='card'>
          <div className='card-header'>
            <h2>My Tasks</h2>
            <select
              value={myTaskStatusFilter}
              onChange={(e) => setMyTaskStatusFilter(e.target.value)}
            >
              <option value=''>All</option>
              <option value='todo'>Todo</option>
              <option value='in_progress'>In Progress</option>
              <option value='completed'>Completed</option>
            </select>
          </div>

          {filteredMyTasks.length === 0 ? (
            <p className='muted'>No assigned tasks.</p>
          ) : (
            <ul className='list'>
              {filteredMyTasks.slice(0, 8).map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.projectName}</small>
                  </div>
                  <div className='inline-actions'>
                    <span className={`badge ${task.priority}`}>{task.priority}</span>
                    <span className={`badge ${task.status}`}>{task.status.replace('_', ' ')}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

