import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/ui';
import { KeyRound, Mail, AlertTriangle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Find redirect path from location state, default based on role
  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loggedUser = await login(email, password);
      
      // Determine redirection target
      let targetPath = '/';
      if (from && from !== '/') {
        targetPath = from;
      } else {
        if (loggedUser.role === 'admin') {
          targetPath = '/dashboard/admin';
        } else if (loggedUser.role === 'builder') {
          targetPath = '/dashboard/builder';
        } else {
          targetPath = '/dashboard/customer';
        }
      }
      
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: 'var(--bc-bg-primary)'
    }}>
      <Card hoverLift={false} style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            display: 'inline-flex',
            width: '48px',
            height: '48px',
            backgroundColor: 'rgba(30, 42, 56, 0.05)',
            borderRadius: 'var(--bc-radius-md)',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--bc-primary)',
            marginBottom: '16px'
          }}>
            <KeyRound size={24} />
          </span>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--bc-primary-dark)', marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.9rem' }}>
            Sign in to manage your construction projects
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--bc-danger)',
            borderRadius: 'var(--bc-radius-sm)',
            padding: '12px',
            color: 'var(--bc-danger)',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-text-muted)' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: 'var(--bc-radius-sm)',
                  border: '1px solid var(--bc-border)',
                  outline: 'none',
                  fontSize: '0.95rem',
                  transition: 'border-color 0.2s',
                  backgroundColor: 'var(--bc-bg-secondary)',
                  color: 'var(--bc-text-primary)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--bc-border-active)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--bc-border)'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--bc-radius-sm)',
                border: '1px solid var(--bc-border)',
                outline: 'none',
                fontSize: '0.95rem',
                transition: 'border-color 0.2s',
                backgroundColor: 'var(--bc-bg-secondary)',
                color: 'var(--bc-text-primary)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--bc-border-active)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--bc-border)'}
            />
          </div>

          <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', marginTop: '10px' }}>
            Sign In
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--bc-text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--bc-primary-light)', fontWeight: 600 }}>
            Sign up now
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
