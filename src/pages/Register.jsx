/* eslint-disable no-use-before-define */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider';

const Register = () => {
  const { register } = useStateContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account 🚀</h2>
        <p style={styles.subtitle}>Register to access the dashboard</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="phone"
            placeholder="Phone Number"
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            style={styles.input}
          />

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Register'}
          </button>

        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  card: {
    background: '#fff',
    padding: 32,
    width: 380,
    borderRadius: 12,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    textAlign: 'center',
  },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { marginBottom: 20, color: '#666' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: 12,
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 15,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 10,
  },
  error: {
    background: '#ffe5e5',
    color: '#c0392b',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  footer: { marginTop: 20, fontSize: 14 },
  link: { color: '#667eea', fontWeight: 600 },
};

export default Register;
