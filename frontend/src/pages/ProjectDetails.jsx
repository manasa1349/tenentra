import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../auth/AuthContext';
import TaskModal from '../components/TaskModal';
import TaskRow from '../components/TaskRow';
import ProjectModal from '../components/ProjectModal';
import '../styles/projectDetails.css';
import PageLoader from '../components/PageLoader';

export default function ProjectDetails() {
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    search: '',
  });
  const isAdmin = user?.role === 'tenant_admin' || user?.role === 'super_admin';

  const loadProject = useCallback(async () => {
    const projectRes = await api.get(`/projects/${projectId}`);
    setProject(projectRes.data.data);
  }, [projectId]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      setUsers([]);
      return;
    }

    try {
      const meRes = await api.get('/auth/me');
      const tenantId = meRes.data.data.tenant?.id;
      if (!tenantId) return;

      const usersRes = await api.get(`/tenants/${tenantId}/users?limit=100`);
      setUsers(usersRes.data.data.users || []);
    } catch {
      setUsers([]);
    }
  }, [isAdmin]);

  const loadTasks = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('limit', '100');
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
    if (filters.search.trim()) params.set('search', filters.search.trim());

    const tasksRes = await api.get(`/projects/${projectId}/tasks?${params.toString()}`);
    setTasks(tasksRes.data.data.tasks || []);
  }, [filters, projectId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadProject(), loadUsers(), loadTasks()]);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [loadProject, loadTasks, loadUsers, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (project) {
      loadTasks();
    }
  }, [project, loadTasks]);

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${projectId}`);
    navigate('/projects');
  };

  if (loading) return <PageLoader text='Loading project...' />;
  if (!project) return null;

  return (
    <div className='page project-details'>
      <div className='project-header'>
        <div>
          <h1>{project.name}</h1>
          <p>{project.description || 'No description'}</p>
          <span className={`badge ${project.status}`}>{project.status}</span>
        </div>

        {isAdmin && (
          <div className='project-actions'>
            <button onClick={() => setShowProjectModal(true)}>Edit Project</button>
            <button className='danger' onClick={handleDeleteProject}>
              Delete Project
            </button>
          </div>
        )}
      </div>

      <div className='tasks-header'>
        <h2>Tasks</h2>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
          >
            + Add Task
          </button>
        )}
      </div>

      <div className='toolbar'>
        <input
          placeholder='Search tasks...'
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

        {isAdmin && (
          <select
            value={filters.assignedTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, assignedTo: e.target.value }))}
          >
            <option value=''>All Assignees</option>
            {users.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.fullName}
              </option>
            ))}
          </select>
        )}
      </div>

      {tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <div className='table-wrap'>
          <table className='data-table tasks-table'>
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
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => {
                    setEditingTask(task);
                    setShowTaskModal(true);
                  }}
                  onDelete={loadTasks}
                  onStatusChange={loadTasks}
                  canEdit={isAdmin}
                  canDelete={isAdmin}
                  canChangeStatus={isAdmin || task.assignedTo?.id === user?.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTaskModal && isAdmin && (
        <TaskModal
          projectId={projectId}
          task={editingTask}
          onClose={() => setShowTaskModal(false)}
          onSaved={loadTasks}
        />
      )}

      {showProjectModal && isAdmin && (
        <ProjectModal
          project={project}
          onClose={() => setShowProjectModal(false)}
          onSaved={async () => {
            await loadProject();
            setShowProjectModal(false);
          }}
        />
      )}
    </div>
  );
}

