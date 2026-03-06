import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../auth/AuthContext';
import ProjectModal from '../components/ProjectModal';
import '../styles/projects.css';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const canManageProjects = user?.role === 'tenant_admin' || user?.role === 'super_admin';

  const loadProjects = useCallback(
    async (nextPage = page, nextStatus = status, nextSearch = search) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(nextPage));
        params.set('limit', '12');
        if (nextStatus) params.set('status', nextStatus);
        if (nextSearch.trim()) params.set('search', nextSearch.trim());

        const res = await api.get(`/projects?${params.toString()}`);
        setProjects(res.data.data.projects || []);
        setPagination(res.data.data.pagination || null);
        setPage(nextPage);
      } finally {
        setLoading(false);
      }
    },
    [page, search, status]
  );

  useEffect(() => {
    loadProjects(1, status, search);
  }, [status, loadProjects, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProjects(1, status, search);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await api.delete(`/projects/${id}`);
    loadProjects(page, status, search);
  };

  return (
    <div className='page projects-page'>
      <div className='page-header projects-header'>
        <h1>Projects</h1>
        {canManageProjects && (
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            + New Project
          </button>
        )}
      </div>

      <form className='toolbar' onSubmit={handleSearchSubmit}>
        <input
          placeholder='Search projects...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value=''>All Status</option>
          <option value='active'>Active</option>
          <option value='completed'>Completed</option>
          <option value='archived'>Archived</option>
        </select>
        <button type='submit'>Apply</button>
      </form>

      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <div className='projects-grid'>
          {projects.map((project) => (
            <article className='project-card' key={project.id}>
              <div>
                <h3>{project.name}</h3>
                <p>{project.description || 'No description'}</p>
              </div>

              <div className='project-meta'>
                <div className='meta-row'>
                  <span className={`badge ${project.status}`}>{project.status}</span>
                  <small>
                    {project.taskCount} tasks • {project.completedTaskCount} done
                  </small>
                </div>

                <small>Owner: {project.createdBy?.fullName || 'Unknown'}</small>

                <div className='actions'>
                  <button onClick={() => navigate(`/projects/${project.id}`)}>View</button>
                  {canManageProjects && (
                    <button
                      onClick={() => {
                        setEditing(project);
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {canManageProjects && (
                    <button className='danger' onClick={() => handleDelete(project.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pagination && (
        <div className='pager'>
          <button disabled={page <= 1} onClick={() => loadProjects(page - 1, status, search)}>
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => loadProjects(page + 1, status, search)}
          >
            Next
          </button>
        </div>
      )}

      {showModal && canManageProjects && (
        <ProjectModal
          project={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => loadProjects(page, status, search)}
        />
      )}
    </div>
  );
}
