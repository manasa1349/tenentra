import { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import '../styles/layout.css';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const loadTenants = useCallback(
    async (nextPage = page, nextStatus = statusFilter, nextPlan = planFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(nextPage));
        params.set('limit', '10');
        if (nextStatus) params.set('status', nextStatus);
        if (nextPlan) params.set('subscriptionPlan', nextPlan);

        const res = await api.get(`/tenants?${params.toString()}`);
        setTenants(res.data.data.tenants || []);
        setPagination(res.data.data.pagination || null);
        setPage(nextPage);
      } finally {
        setLoading(false);
      }
    },
    [page, planFilter, statusFilter]
  );

  useEffect(() => {
    loadTenants(1, statusFilter, planFilter);
  }, [statusFilter, planFilter, loadTenants]);

  return (
    <div className='page'>
      <div className='page-header'>
        <h1>Tenants</h1>
      </div>

      <div className='toolbar'>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value=''>All Status</option>
          <option value='active'>Active</option>
          <option value='suspended'>Suspended</option>
          <option value='trial'>Trial</option>
        </select>

        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
          <option value=''>All Plans</option>
          <option value='free'>Free</option>
          <option value='pro'>Pro</option>
          <option value='enterprise'>Enterprise</option>
        </select>
      </div>

      {loading ? (
        <p>Loading tenants...</p>
      ) : (
        <div className='table-wrap'>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Subdomain</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.subdomain}</td>
                  <td>{tenant.status}</td>
                  <td>{tenant.subscriptionPlan}</td>
                  <td>{tenant.totalUsers}</td>
                  <td>{tenant.totalProjects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <div className='pager'>
          <button disabled={page <= 1} onClick={() => loadTenants(page - 1)}>
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => loadTenants(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
