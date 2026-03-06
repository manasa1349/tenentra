import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const canViewTasks = user
    ? ['user', 'tenant_admin', 'super_admin'].includes(user.role)
    : false;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className='navbar'>
      <div className='nav-shell'>
        <Link to='/dashboard' className='brand'>
          <span className='brand-dot' />
          <span className='brand-word'>Tenantra</span>
        </Link>

        <button
          className='menu-toggle'
          type='button'
          onClick={() => setMenuOpen(true)}
          aria-label='Open navigation menu'
        >
          <span className='hamburger-icon' aria-hidden='true'>
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav className='nav-links desktop-links'>
          <NavLink to='/' onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to='/dashboard' onClick={() => setMenuOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to='/projects' onClick={() => setMenuOpen(false)}>
            Projects
          </NavLink>
          {canViewTasks && (
            <NavLink to='/tasks' onClick={() => setMenuOpen(false)}>
              Tasks
            </NavLink>
          )}
          {user.role === 'tenant_admin' && (
            <NavLink to='/users' onClick={() => setMenuOpen(false)}>
              Users
            </NavLink>
          )}
          {user.role === 'super_admin' && (
            <NavLink to='/tenants' onClick={() => setMenuOpen(false)}>
              Tenants
            </NavLink>
          )}
        </nav>

        {menuOpen && (
          <>
            <button
              type='button'
              className='nav-overlay'
              onClick={() => setMenuOpen(false)}
              aria-label='Close navigation menu'
            />
            <aside className='nav-drawer'>
              <div className='nav-drawer-top'>
                <strong>Menu</strong>
                <button type='button' className='drawer-close' onClick={() => setMenuOpen(false)}>
                  Close
                </button>
              </div>

              <nav className='nav-links drawer-links'>
                <NavLink to='/' onClick={() => setMenuOpen(false)}>
                  Home
                </NavLink>
                <NavLink to='/dashboard' onClick={() => setMenuOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to='/projects' onClick={() => setMenuOpen(false)}>
                  Projects
                </NavLink>
                {canViewTasks && (
                  <NavLink to='/tasks' onClick={() => setMenuOpen(false)}>
                    Tasks
                  </NavLink>
                )}
                {user.role === 'tenant_admin' && (
                  <NavLink to='/users' onClick={() => setMenuOpen(false)}>
                    Users
                  </NavLink>
                )}
                {user.role === 'super_admin' && (
                  <NavLink to='/tenants' onClick={() => setMenuOpen(false)}>
                    Tenants
                  </NavLink>
                )}
              </nav>

              <div className='drawer-user-actions'>
                <button
                  type='button'
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/profile');
                  }}
                >
                  Profile
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                >
                  Settings
                </button>
                <button type='button' className='danger' onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </aside>
          </>
        )}

        <div className='user-menu-wrap' ref={userMenuRef}>
          <button
            className='user-trigger'
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-expanded={userMenuOpen}
            aria-haspopup='menu'
            type='button'
          >
            <span className='user-avatar'>{user.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
            <span className='user-meta'>
              <span className='user-name'>{user.fullName}</span>
              <span className='user-role'>{user.role}</span>
            </span>
          </button>

          {userMenuOpen && (
            <div className='user-menu' role='menu'>
              <div className='user-menu-meta'>
                <strong>{user.fullName}</strong>
                <span>{user.email}</span>
              </div>
              <button
                type='button'
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/profile');
                }}
              >
                Profile
              </button>
              <button
                type='button'
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/settings');
                }}
              >
                Settings
              </button>
              <button type='button' className='danger' onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
