import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';
import '../styles/account.css';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [nameMessage, setNameMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(user?.fullName || '');
  }, [user]);

  const saveName = async (event) => {
    event.preventDefault();
    setError('');
    setNameMessage('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setSavingName(true);
    try {
      await api.put('/auth/me', { fullName: fullName.trim() });
      await refreshUser();
      setNameMessage('Profile updated successfully');
      toast.success('Profile name updated');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      setError(message);
      toast.error(message);
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError('');
    setPasswordMessage('');

    if (!currentPassword || !newPassword) {
      setError('Current and new password are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password must match');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/auth/me', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated successfully');
      toast.success('Password updated successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update password';
      setError(message);
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className='page account-page'>
      <div className='page-header'>
        <h1>Profile</h1>
      </div>

      {error && <p className='error'>{error}</p>}

      <section className='account-grid'>
        <article className='account-card'>
          <h2>Account Summary</h2>
          <dl className='account-details'>
            <div>
              <dt>Full Name</dt>
              <dd>{user?.fullName || '-'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email || '-'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user?.role || '-'}</dd>
            </div>
            <div>
              <dt>Tenant</dt>
              <dd>{user?.tenant?.name || 'System (super admin)'}</dd>
            </div>
          </dl>
        </article>

        <article className='account-card'>
          <h2>Edit Profile</h2>
          {nameMessage && <p className='success'>{nameMessage}</p>}
          <form onSubmit={saveName} className='stack-form'>
            <label htmlFor='profileFullName'>Full Name</label>
            <input
              id='profileFullName'
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            <button disabled={savingName}>{savingName ? 'Saving...' : 'Save Name'}</button>
          </form>
        </article>

        <article className='account-card'>
          <h2>Change Password</h2>
          {passwordMessage && <p className='success'>{passwordMessage}</p>}
          <form onSubmit={savePassword} className='stack-form'>
            <label htmlFor='currentPassword'>Current Password</label>
            <input
              id='currentPassword'
              type='password'
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />

            <label htmlFor='newPassword'>New Password</label>
            <input
              id='newPassword'
              type='password'
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />

            <label htmlFor='confirmPassword'>Confirm New Password</label>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            <button disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
