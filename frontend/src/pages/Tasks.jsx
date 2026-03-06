import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../auth/AuthContext';
import '../styles/tasks.css';
import '../styles/layout.css';
import PageLoader from '../components/PageLoader';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const projectsRes = await api.get('/projects?limit=100');
      const projects = projectsRes.data.data.projects || [];

      const responses = await Promise.all(
        projects.map(async (project) => {
          const params = new URLSearchParams();
          params.set('limit', '100');
          if (user?.role === 'user' && user.id) {
            params.set('assignedTo', user.id);
          }

          return api
            .get(`/projects/${project.id}/tasks?${params.toString()}`)
            .then((res) => ({
              project,
              tasks: (res.data.data.tasks || []).map((task) => ({
                ...task,
                projectId: project.id,
                projectName: project.name,
              })),
            }))
            .catch(() => ({ project, tasks: [] }));
        })
      );

      setTasks(responses.flatMap((entry) => entry.tasks));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefRes = await api.get('/auth/preferences');
        const preferredView = prefRes.data?.data?.defaultTaskView;
        if (preferredView === 'board' || preferredView === 'list') {
          setViewMode(preferredView);
        }
      } catch {
        // no-op: keep default board view
      }
    };

    loadPreferences();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user, loadTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      return true;
    });
  }, [tasks, filters]);

  const statusBuckets = useMemo(() => {
    return {
      todo: filteredTasks.filter((task) => task.status === 'todo'),
      in_progress: filteredTasks.filter((task) => task.status === 'in_progress'),
      completed: filteredTasks.filter((task) => task.status === 'completed'),
    };
  }, [filteredTasks]);

  const updateTaskStatus = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}/status`, { status });
    await loadTasks();
  };

  if (loading) return <PageLoader text='Loading tasks...' />;

  return (
    <div className='page tasks-page'>
      <div className='page-header'>
        <h1>Task Board</h1>
        <div className='view-toggle'>
          <button
            type='button'
            className={viewMode === 'board' ? 'active' : ''}
            onClick={() => setViewMode('board')}
          >
            Board View
          </button>
          <button
            type='button'
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>
      </div>

      <div className='toolbar'>
        <input
          placeholder='Search task title...'
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
        />

        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value=''>All Status</option>
          <option value='todo'>Todo</option>
          <option value='in_progress'>In Progress</option>
          <option value='completed'>Completed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
        >
          <option value=''>All Priority</option>
          <option value='high'>High</option>
          <option value='medium'>Medium</option>
          <option value='low'>Low</option>
        </select>
      </div>

      {viewMode === 'board' ? (
        <div className='task-columns'>
          {Object.entries(statusBuckets).map(([statusKey, items]) => (
            <section key={statusKey} className={`task-column status-${statusKey}`}>
              <header>
                <h2>{statusKey.replace('_', ' ')}</h2>
                <span>{items.length}</span>
              </header>

              <div className='task-list'>
                {items.length === 0 && <p className='muted'>No tasks</p>}

                {items.map((task) => (
                  <article key={task.id} className='task-card'>
                    <h3>{task.title}</h3>
                    <p>{task.description || 'No description'}</p>
                    <div className='task-meta'>
                      <span className={`badge ${task.priority}`}>{task.priority}</span>
                      <span className='muted'>{task.projectName}</span>
                    </div>
                    <div className='task-meta'>
                      <span className='muted'>
                        {task.assignedTo?.fullName || 'Unassigned'}
                      </span>
                      <span className='muted'>
                        {task.dueDate ? String(task.dueDate).split('T')[0] : 'No due date'}
                      </span>
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    >
                      <option value='todo'>Todo</option>
                      <option value='in_progress'>In Progress</option>
                      <option value='completed'>Completed</option>
                    </select>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className='table-wrap'>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <p className='muted'>No tasks found for the selected filters.</p>
                  </td>
                </tr>
              )}
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.projectName}</td>
                  <td>
                    <span className={`badge ${task.priority}`}>{task.priority}</span>
                  </td>
                  <td>{task.assignedTo?.fullName || 'Unassigned'}</td>
                  <td>{task.dueDate ? String(task.dueDate).split('T')[0] : '-'}</td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                    >
                      <option value='todo'>Todo</option>
                      <option value='in_progress'>In Progress</option>
                      <option value='completed'>Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

