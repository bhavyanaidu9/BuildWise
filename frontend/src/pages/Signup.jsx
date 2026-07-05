import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/ui';
import { UserPlus, Mail, Phone, User, AlertTriangle, CheckCircle2 } from 'lucide-react';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // default customer
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await signup(name, email, phone, password, role);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create account. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: 'var(--bc-bg-primary)'
    }}>
      <Card hoverLift={false} style={{ width: '100%', maxWidth: '460px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            <UserPlus size={24} />
          </span>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--bc-primary-dark)', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.9rem' }}>
            Join BuildConnect as a Customer or verified Builder
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

        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--bc-success)',
            borderRadius: 'var(--bc-radius-sm)',
            padding: '12px',
            color: 'var(--bc-success)',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={16} />
            <span>Registration successful! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Role selector toggle - Strictly only Customer & Builder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>
              I want to sign up as a:
            </label>
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bc-bg-tertiary)',
              padding: '4px',
              borderRadius: 'var(--bc-radius-md)',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setRole('customer')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--bc-radius-sm)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: role === 'customer' ? 'var(--bc-bg-secondary)' : 'transparent',
                  color: role === 'customer' ? 'var(--bc-primary-dark)' : 'var(--bc-text-secondary)',
                  boxShadow: role === 'customer' ? 'var(--bc-shadow-sm)' : 'none'
                }}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('builder')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--bc-radius-sm)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: role === 'builder' ? 'var(--bc-bg-secondary)' : 'transparent',
                  color: role === 'builder' ? 'var(--bc-primary-dark)' : 'var(--bc-text-secondary)',
                  boxShadow: role === 'builder' ? 'var(--bc-shadow-sm)' : 'none'
                }}
              >
                Builder
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-text-muted)' }}>
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
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
              Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-text-muted)' }}>
                <Phone size={16} />
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
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
              placeholder="Minimum 6 characters"
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
            Create Account
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--bc-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--bc-primary-light)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Signup;
