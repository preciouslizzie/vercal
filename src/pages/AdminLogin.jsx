import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/adminAuth';

export default function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');

    if (token && admin.role === 'admin') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await adminLogin(email, password);

      console.debug('Login response data:', data);

      // Store admin token & data
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));

      navigate('/dashboard');
    } catch (err) {
      console.error('Admin login error:', err);
      const serverMessage = err.response?.data?.message;
      const serverData = err.response?.data;
      const statusText = err.response?.statusText;

      setError(serverMessage || statusText || err.message || 'Login failed. Please check your credentials.');
      setErrorDetails(serverData || { message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back 👋</h2>
        <p style={styles.subtitle}>Sign in to your admin dashboard</p>

        {error && <p style={styles.error}>{error}</p>}
        {errorDetails && (
          <pre style={styles.errorDetails}>{JSON.stringify(errorDetails, null, 2)}</pre>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoComplete="email"
            required
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={styles.toggleButton}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p style={styles.footer}>
          Don’t have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#fff',
    borderRadius: 12,
    padding: '32px 28px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    textAlign: 'center',
  },
  title: {
    marginBottom: 6,
    fontSize: 24,
    fontWeight: 700,
  },
  subtitle: {
    marginBottom: 24,
    color: '#666',
    fontSize: 14,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  input: {
    padding: '12px 14px',
    fontSize: 15,
    borderRadius: 8,
    border: '1px solid #ddd',
    outline: 'none',
  },
  button: {
    marginTop: 10,
    padding: '12px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  error: {
    background: '#ffe5e5',
    color: '#c0392b',
    padding: '10px',
    borderRadius: 6,
    marginBottom: 14,
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
    fontSize: 14,
    color: '#555',
  },
  link: {
    color: '#667eea',
    fontWeight: 600,
    textDecoration: 'none',
  },
  toggleButton: {
    padding: '8px 10px',
    fontSize: 13,
    borderRadius: 8,
    border: '1px solid #ddd',
    background: '#f6f6f6',
    cursor: 'pointer',
  },
};
