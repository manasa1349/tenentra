import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/api';
import { useAuth } from '../auth/AuthContext';
import '../styles/auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    tenantSubdomain: '',
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        email: form.email,
        password: form.password,
      };

      if (form.tenantSubdomain.trim()) {
        payload.tenantSubdomain = form.tenantSubdomain.trim().toLowerCase();
      }

      const res = await api.post('/auth/login', payload);
      const token = res.data?.data?.token;

      if (!token) {
        throw new Error('Token missing from response');
      }

      await login(token, form.rememberMe);
      toast.success('Signed in successfully');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-layout'>
      <form className='auth-card' onSubmit={handleSubmit}>
        <h1>Sign in</h1>
        <p>Use tenant subdomain for tenant users. Leave it empty for super admin.</p>

        {error && <div className='error'>{error}</div>}

        <label htmlFor='email'>Email</label>
        <input
          id='email'
          type='email'
          name='email'
          required
          value={form.email}
          onChange={handleChange}
        />

        <label htmlFor='password'>Password</label>
        <div className='input-inline'>
          <input
            id='password'
            type={showPassword ? 'text' : 'password'}
            name='password'
            required
            value={form.password}
            onChange={handleChange}
          />
          <button
            type='button'
            className='toggle-btn'
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <label htmlFor='tenantSubdomain'>Tenant Subdomain</label>
        <input
          id='tenantSubdomain'
          type='text'
          name='tenantSubdomain'
          placeholder='demo'
          value={form.tenantSubdomain}
          onChange={handleChange}
        />

        <label className='checkbox'>
          <input
            type='checkbox'
            name='rememberMe'
            checked={form.rememberMe}
            onChange={handleChange}
          />
          Remember me
        </label>

        <button type='submit' disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className='auth-link'>
          Need an account? <Link to='/register'>Register a tenant</Link>
        </p>
        <p className='auth-link secondary'>
          <Link to='/'>Back to Home</Link>
        </p>
      </form>
    </div>
  );
}
