import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, StatusBadge, CurrencyDisplay } from '../components/ui';
import { 
  MapPin, 
  Award, 
  Briefcase, 
  ShieldCheck, 
  Star, 
  ArrowLeft,
  Mail,
  Phone,
  Image as ImageIcon,
  Check,
  AlertTriangle
} from 'lucide-react';

const BuilderProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/builders/${id}`);
      if (!res.ok) {
        throw new Error('Builder profile not found');
      }
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load builder profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleToggleVerification = async () => {
    if (!user || user.role !== 'admin') return;

    setVerifying(true);
    try {
      const res = await apiRequest(`/api/builders/${id}/verify`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update verification status');
      }

      const verifyData = await res.json();
      setProfile(prev => ({
        ...prev,
        is_verified: verifyData.is_verified,
        verification_notes: verifyData.verification_notes
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--bc-text-secondary)' }}>Loading builder details...</div>;
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <Card>
          <AlertTriangle size={48} color="var(--bc-danger)" style={{ marginBottom: '16px' }} />
          <h2>Profile Not Found</h2>
          <p style={{ color: 'var(--bc-text-secondary)', marginBottom: '24px' }}>{error || 'The builder you requested does not exist.'}</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Directory
          </Button>
        </Card>
      </div>
    );
  }

  const isAdmin = user && user.role === 'admin';

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          border: 'none',
          background: 'transparent',
          color: 'var(--bc-text-secondary)',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: 600,
          fontSize: '0.95rem'
        }}
      >
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Main Profile Header Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Company Info Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--bc-primary-dark)', marginBottom: '8px' }}>
                  {profile.business_name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={12} /> {profile.specialization}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--bc-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={14} /> {profile.years_experience} Years Experience
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <StatusBadge status={profile.is_verified ? "verified" : "unverified"} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={16} fill="var(--bc-accent)" color="var(--bc-accent)" />
                  <span style={{ fontWeight: 700 }}>{profile.avg_rating || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Admin Verification Controls */}
            {isAdmin && (
              <div style={{
                backgroundColor: 'var(--bc-bg-tertiary)',
                borderRadius: 'var(--bc-radius-md)',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                borderLeft: '4px solid var(--bc-primary-light)'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--bc-text-secondary)', fontWeight: 600 }}>ADMIN CONTROL PANEL</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--bc-text-muted)', marginTop: '2px' }}>
                    {profile.verification_notes || "Not yet verified by administration."}
                  </div>
                </div>
                <Button 
                  variant={profile.is_verified ? "danger" : "primary"} 
                  size="sm" 
                  loading={verifying}
                  onClick={handleToggleVerification}
                >
                  {profile.is_verified ? "Revoke Verification" : "Verify Builder"}
                </Button>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '10px' }}>About Company</h3>
              <p style={{ color: 'var(--bc-text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                {profile.bio || "No description provided."}
              </p>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Service Areas</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.service_areas.map((area, idx) => (
                  <span key={idx} style={{
                    backgroundColor: 'var(--bc-bg-primary)',
                    color: 'var(--bc-text-primary)',
                    border: '1px solid var(--bc-border)',
                    padding: '6px 12px',
                    borderRadius: 'var(--bc-radius-sm)',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <MapPin size={12} color="var(--bc-primary-light)" /> {area}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Portfolio Gallery */}
          <section>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Project Portfolio</h2>
            {profile.portfolio.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--bc-border)' }}>
                <ImageIcon size={32} color="var(--bc-text-muted)" style={{ marginBottom: '12px' }} />
                <p style={{ color: 'var(--bc-text-secondary)' }}>No portfolio items uploaded yet.</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {profile.portfolio.map((item) => (
                  <Card key={item.id} style={{ padding: '0', overflow: 'hidden' }} hoverLift>
                    <img 
                      src={item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`} 
                      alt={item.title} 
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
                    />
                    <div style={{ padding: '20px' }}>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{item.title}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--bc-text-muted)', marginBottom: '8px' }}>
                        Completed: {item.project_date}
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--bc-text-secondary)', lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Reviews list */}
          <section>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Customer Reviews</h2>
            {profile.reviews.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--bc-border)' }}>
                <Star size={32} color="var(--bc-text-muted)" style={{ marginBottom: '12px' }} />
                <p style={{ color: 'var(--bc-text-secondary)' }}>No reviews submitted yet.</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {profile.reviews.map((rev) => (
                  <Card key={rev.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--bc-primary-dark)' }}>{rev.customer_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)' }}>
                          {new Date(rev.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: 'rgba(244,163,0,0.1)', padding: '4px 8px', borderRadius: 'var(--bc-radius-sm)' }}>
                        <Star size={12} fill="var(--bc-accent)" color="var(--bc-accent)" />
                        <strong style={{ fontSize: '0.85rem', color: 'var(--bc-accent)' }}>{rev.rating}</strong>
                      </div>
                    </div>
                    <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                      "{rev.comment}"
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '90px' }}>
          <Card>
            <h3 style={{ borderBottom: '1px solid var(--bc-border)', paddingBottom: '8px', marginBottom: '16px' }}>
              Project Bounds
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)', textTransform: 'uppercase' }}>Affiliation Budget Range</div>
              {/* Formatted in INR Lakh notation */}
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--bc-primary-dark)', marginTop: '4px' }}>
                <CurrencyDisplay amountMin={profile.budget_min} amountMax={profile.budget_max} />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--bc-border)', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)', textTransform: 'uppercase' }}>Representative</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--bc-text-primary)', marginTop: '2px' }}>{profile.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)', textTransform: 'uppercase' }}>Email</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--bc-text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>{profile.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)', textTransform: 'uppercase' }}>Phone</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--bc-text-secondary)', marginTop: '2px' }}>{profile.phone}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px' }}>
              <Button variant="primary" style={{ width: '100%' }} onClick={() => alert('Message Representative')}>
                Contact Builder
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default BuilderProfileDetail;

