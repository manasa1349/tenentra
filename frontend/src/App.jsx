import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './auth/AuthContext';

import Login from './auth/Login';
import Register from './auth/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Tenants from './pages/Tenants';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to='/login' replace />;

  return children;
}

function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to='/login' replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to='/dashboard' replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const showNavbar = isAuthenticated && location.pathname !== '/';

  return (
    <>
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            background: '#173247',
            color: '#eaf5fd',
            border: '1px solid rgba(141, 180, 203, 0.5)',
          },
        }}
      />
      {showNavbar && <Navbar />}

      <Routes>
        <Route path='/' element={<Home isAuthenticated={isAuthenticated} />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path='/projects'
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

        <Route
          path='/projects/:projectId'
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path='/tasks'
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['user', 'tenant_admin', 'super_admin']}>
                <Tasks />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path='/settings'
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path='/users'
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['tenant_admin']}>
                <Users />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path='/tenants'
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['super_admin']}>
                <Tenants />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path='*'
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />}
        />
      </Routes>
    </>
  );
}
