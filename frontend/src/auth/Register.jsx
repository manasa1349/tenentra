import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import api from '../api/api';
import '../styles/auth.css';

const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    tenantName: '',
    subdomain: '',
    adminEmail: '',
    adminFullName: '',
    adminPassword: '',
    confirmPassword: '',
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validate = () => {
    if (form.adminPassword !== form.confirmPassword) {
      return 'Passwords do not match';
    }

    if (form.adminPassword.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (!form.terms) {
      return 'Please accept Terms & Conditions';
    }

    if (!subdomainRegex.test(form.subdomain)) {
      return 'Invalid subdomain format';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register-tenant', {
        tenantName: form.tenantName.trim(),
        subdomain: form.subdomain.trim().toLowerCase(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminFullName: form.adminFullName.trim(),
        adminPassword: form.adminPassword,
      });

      setSuccess('Tenant created successfully. Redirecting to login...');
      toast.success('Tenant created successfully');
      confetti({
        particleCount: 90,
        spread: 72,
        origin: { y: 0.7 },
      });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-layout'>
      <form className='auth-card' onSubmit={handleSubmit}>
        <h1>Create Tenant</h1>
        <p>Start with free plan. You can upgrade limits later.</p>

        {error && <div className='error'>{error}</div>}
        {success && <div className='success'>{success}</div>}

        <label htmlFor='tenantName'>Organization Name</label>
        <input
          id='tenantName'
          name='tenantName'
          required
          value={form.tenantName}
          onChange={handleChange}
        />

        <label htmlFor='subdomain'>Subdomain</label>
        <input
          id='subdomain'
          name='subdomain'
          required
          placeholder='acme'
          value={form.subdomain}
          onChange={handleChange}
        />
        <small>{form.subdomain || 'your-company'}.tenantra.app</small>

        <label htmlFor='adminEmail'>Admin Email</label>
        <input
          id='adminEmail'
          type='email'
          name='adminEmail'
          required
          value={form.adminEmail}
          onChange={handleChange}
        />

        <label htmlFor='adminFullName'>Admin Full Name</label>
        <input
          id='adminFullName'
          name='adminFullName'
          required
          value={form.adminFullName}
          onChange={handleChange}
        />

        <label htmlFor='adminPassword'>Password</label>
        <div className='input-inline'>
          <input
            id='adminPassword'
            type={showPassword ? 'text' : 'password'}
            name='adminPassword'
            required
            value={form.adminPassword}
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

        <label htmlFor='confirmPassword'>Confirm Password</label>
        <input
          id='confirmPassword'
          type='password'
          name='confirmPassword'
          required
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <label className='checkbox'>
          <input
            type='checkbox'
            name='terms'
            checked={form.terms}
            onChange={handleChange}
          />
          I agree to Terms & Conditions
        </label>

        <button type='submit' disabled={loading}>
          {loading ? 'Creating...' : 'Create Tenant'}
        </button>

        <p className='auth-link'>
          Already registered? <Link to='/login'>Sign in</Link>
        </p>
        <p className='auth-link secondary'>
          <Link to='/'>Back to Home</Link>
        </p>
      </form>
    </div>
  );
}
