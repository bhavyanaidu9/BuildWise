import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, StatusBadge, CurrencyDisplay, EmptyState, Spinner } from '../components/ui';
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  MapPin, 
  Star, 
  ExternalLink 
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, apiRequest } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // pending, verified
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all builders in Hyderabad via the search endpoint with a high limit
  const fetchBuilders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/builders/search?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setBuilders(data.builders || []);
      } else {
        throw new Error('Failed to retrieve builder accounts');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilders();
  }, []);

  // Handle Verify or Revoke verification
  const handleToggleVerification = async (builderId) => {
    try {
      const res = await apiRequest(`/api/builders/${builderId}/verify`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Status action failed');
      }

      // Reload builders
      fetchBuilders();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--bc-text-secondary)' }}><Spinner size="lg" /></div>;
  }

  // Filter builders based on status
  const pendingBuilders = builders.filter(b => !b.is_verified);
  const verifiedBuilders = builders.filter(b => b.is_verified);

  return (
    <div className="admin-dashboard-container">
      
      {/* Header Banner */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">BuildConnect Verification Center</h1>
          <p className="admin-subtitle">
            Validate legal details, verify skills, and authorize builder directories in Hyderabad.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ShieldCheck size={28} color="var(--bc-accent)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--bc-text-muted)', fontWeight: 600 }}>Admin Access</span>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--bc-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: 'var(--bc-radius-sm)', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Tabs list */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('pending')}
          className={`admin-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
        >
          Pending Verification
          <span className="admin-tab-badge pending">
            {pendingBuilders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('verified')}
          className={`admin-tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
        >
          Authorized Builders
          <span className="admin-tab-badge verified">
            {verifiedBuilders.length}
          </span>
        </button>
      </div>

      {/* Tab Panel contents */}
      <div>
        {activeTab === 'pending' && (
          <div>
            {pendingBuilders.length === 0 ? (
              <EmptyState
                icon="🎉"
                title="All Builders Verified"
                description="There are no pending builder signups currently waiting for verification."
              />
            ) : (
              <div className="builders-list">
                {pendingBuilders.map((b) => (
                  <Card key={b.user_id}>
                    <div className="builder-meta">
                      <span className="builder-specialization">{b.specialization}</span>
                      <StatusBadge status="unverified" colorMap={{ unverified: "warning" }} />
                    </div>

                    <h3 className="builder-card-title">{b.business_name}</h3>
                    <div className="builder-subtext">
                      {b.name} &bull; {b.years_experience} Yrs Exp &bull; <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {b.location}
                    </div>
                    <p className="builder-bio">{b.bio}</p>

                    <div className="builder-footer">
                      <div>
                        <div className="builder-budget-label">Capability Range</div>
                        <div className="builder-budget-amount">
                          <CurrencyDisplay amountMin={b.budget_min} amountMax={b.budget_max} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="primary" size="sm" onClick={() => handleToggleVerification(b.user_id)}>
                          <UserCheck size={14} /> Verify
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'verified' && (
          <div>
            {verifiedBuilders.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No Verified Builders"
                description="Verified accounts will be cataloged here. Revoke authorization if details lapse."
              />
            ) : (
              <div className="builders-list">
                {verifiedBuilders.map((b) => (
                  <Card key={b.user_id}>
                    <div className="builder-meta">
                      <span className="builder-specialization">{b.specialization}</span>
                      <StatusBadge status="verified" />
                    </div>

                    <h3 className="builder-card-title">{b.business_name}</h3>
                    <div className="builder-subtext">
                      {b.name} &bull; {b.years_experience} Yrs Exp &bull; <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {b.location}
                    </div>
                    <p className="builder-bio">{b.bio}</p>

                    <div className="builder-footer">
                      <div>
                        <div className="builder-budget-label">Capability Range</div>
                        <div className="builder-budget-amount">
                          <CurrencyDisplay amountMin={b.budget_min} amountMax={b.budget_max} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="danger" size="sm" onClick={() => handleToggleVerification(b.user_id)}>
                          <UserX size={14} /> Revoke
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;

