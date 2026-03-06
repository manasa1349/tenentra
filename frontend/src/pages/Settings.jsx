import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/api';
import '../styles/account.css';
import PageLoader from '../components/PageLoader';

const defaultSettings = {
  emailNotifications: true,
  taskDueReminders: true,
  weeklySummary: false,
  defaultTaskView: 'board',
};

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/auth/preferences');
        setSettings({ ...defaultSettings, ...response.data.data });
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load settings';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateField = (name, value) => {
    setSuccess('');
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/auth/preferences', {
        emailNotifications: settings.emailNotifications,
        taskDueReminders: settings.taskDueReminders,
        weeklySummary: settings.weeklySummary,
        defaultTaskView: settings.defaultTaskView,
      });
      setSettings((prev) => ({ ...prev, ...response.data.data }));
      setSuccess('Settings saved successfully');
      toast.success('Settings saved');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save settings';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader text='Loading settings...' />;

  return (
    <div className='page account-page'>
      <div className='page-header'>
        <h1>Settings</h1>
      </div>

      {error && <p className='error'>{error}</p>}
      {success && <p className='success'>{success}</p>}

      <section className='account-grid single'>
        <article className='account-card'>
          <h2>Notification Preferences</h2>
          <form className='stack-form' onSubmit={saveSettings}>
            <label className='toggle-field' htmlFor='emailNotifications'>
              <input
                id='emailNotifications'
                type='checkbox'
                checked={settings.emailNotifications}
                onChange={(event) => updateField('emailNotifications', event.target.checked)}
              />
              <span>Email Notifications</span>
            </label>

            <label className='toggle-field' htmlFor='taskDueReminders'>
              <input
                id='taskDueReminders'
                type='checkbox'
                checked={settings.taskDueReminders}
                onChange={(event) => updateField('taskDueReminders', event.target.checked)}
              />
              <span>Task Due Reminders</span>
            </label>

            <label className='toggle-field' htmlFor='weeklySummary'>
              <input
                id='weeklySummary'
                type='checkbox'
                checked={settings.weeklySummary}
                onChange={(event) => updateField('weeklySummary', event.target.checked)}
              />
              <span>Weekly Summary Email</span>
            </label>

            <label htmlFor='defaultTaskView'>Default Task View</label>
            <select
              id='defaultTaskView'
              value={settings.defaultTaskView}
              onChange={(event) => updateField('defaultTaskView', event.target.value)}
            >
              <option value='board'>Board</option>
              <option value='list'>List</option>
            </select>

            <button disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </form>
        </article>
      </section>
    </div>
  );
}
