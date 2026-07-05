import { API_BASE_URL } from './config';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BuilderProfileEdit from './pages/BuilderProfileEdit';
import BuilderProfileDetail from './pages/BuilderProfileDetail';
import BuildersSearch from './pages/BuildersSearch';
import CustomerDashboard from './pages/CustomerDashboard';
import BuilderDashboard from './pages/BuilderDashboard';
import ProjectDetail from './pages/ProjectDetail';
import ProjectTracking from './pages/ProjectTracking';
import AdminDashboard from './pages/AdminDashboard';
import { Button, Card, StatusBadge, CurrencyDisplay } from './components/ui';
import { 
  Activity, 
  MapPin, 
  Star, 
  LogOut, 
  Layers,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

// Common Header & Footer Layout Wrapper
const PageLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState({ loading: true, connected: false, db: 'unknown' });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthRes = await fetch(`${API_BASE_URL}/api/health`);
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setApiStatus({ loading: false, connected: true, db: healthData.database });
        } else {
          setApiStatus({ loading: false, connected: false, db: 'unhealthy' });
        }
      } catch (err) {
        setApiStatus({ loading: false, connected: false, db: 'unreachable' });
      }
    };
    checkHealth();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bc-bg-primary)' }}>
      {/* Navbar */}
      <header style={{
        backgroundColor: 'var(--bc-bg-secondary)',
        borderBottom: '1px solid var(--bc-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--bc-shadow-sm)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {/* Logo strictly uses --bc-primary and --bc-accent */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--bc-radius-sm)',
                backgroundColor: 'var(--bc-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: 'var(--bc-accent)'
              }}>
                BC
              </div>
              <span style={{
                fontFamily: 'var(--bc-font-display)',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--bc-primary)',
              }}>
                Build<span style={{ color: 'var(--bc-accent)' }}>Connect</span>
              </span>
            </Link>

            {/* Navigation links */}
            <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Link 
                to="/builders" 
                style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: 600, 
                  color: 'var(--bc-text-secondary)',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--bc-primary-light)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--bc-text-secondary)'}
              >
                Browse Builders
              </Link>

              {/* Show an "Admin" link only when user.role === 'admin' */}
              {user && user.role === 'admin' && (
                <Link 
                  to="/dashboard/admin" 
                  style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 700, 
                    color: 'var(--bc-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={14} /> Admin Verification Panel
                </Link>
              )}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Health check status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${apiStatus.connected ? 'badge-success' : 'badge-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={12} />
                {apiStatus.loading ? 'Checking...' : apiStatus.connected ? 'API Connected' : 'API Offline'}
              </span>
            </div>

            {/* Session Actions */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-secondary)', textTransform: 'capitalize' }}>Role: {user.role}</div>
                </div>
                {/* Redirect directly based on role */}
                <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/${user.role}`)}>
                  My Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }} style={{ padding: '8px 12px' }}>
                  <LogOut size={14} />
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/login">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--bc-primary-dark)',
        color: 'var(--bc-text-muted)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        marginTop: '60px',
        textAlign: 'center',
        fontSize: '0.85rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            &copy; {new Date().getFullYear()} BuildConnect India. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ color: 'var(--bc-accent)' }}>Hyderabad Verified Directory</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 1. Landing Homepage
const Home = () => {
  const { user } = useAuth();
  const [builders, setBuilders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bRes = await fetch(`${API_BASE_URL}/api/builders/search?limit=3`);
        const pRes = await fetch(`${API_BASE_URL}/api/projects`);
        if (bRes.ok) {
          const bData = await bRes.json();
          setBuilders(bData.builders || []);
        }
        if (pRes.ok) setProjects(await pRes.json());
      } catch (err) {
        console.error("Failed to load directories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Banner Card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bc-primary) 0%, var(--bc-primary-light) 100%)',
        borderRadius: 'var(--bc-radius-lg)',
        padding: '40px',
        color: 'var(--bc-bg-secondary)',
        boxShadow: 'var(--bc-shadow-lg)',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <span className="badge badge-warning" style={{ color: 'var(--bc-primary-dark)', fontWeight: 700, marginBottom: '16px' }}>
          Hyderabad District
        </span>
        <h1 style={{ color: '#FFFFFF', fontSize: '2.5rem', marginBottom: '12px' }}>
          BuildConnect Construction Marketplace
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', maxWidth: '700px', marginBottom: '24px' }}>
          Direct, verified connections between home developers and builders. Free transparent quote submittals and milestone payment tracking.
        </p>

        {user ? (
          <Link to={`/dashboard/${user.role}`}>
            <Button variant="accent">
              Go to my Dashboard <ChevronRight size={16} />
            </Button>
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/signup">
              <Button variant="accent">Get Started</Button>
            </Link>
            <Link to="/builders">
              <Button variant="outline" style={{ color: '#FFF', borderColor: '#FFF' }}>Browse Directory</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Directory Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        
        {/* Builders list */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2>Featured Local Builders</h2>
              <p style={{ color: 'var(--bc-text-secondary)' }}>Verified active firms and contractors</p>
            </div>
            <Link to="/builders">
              <Button variant="outline" size="sm">View All Builders</Button>
            </Link>
          </div>
          
          {loading ? (
            <p>Loading builders...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {builders.map(b => (
                <Link to={`/builders/${b.user_id}`} key={b.user_id} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <Card hoverLift>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className="badge badge-info">{b.specialization}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="var(--bc-accent)" color="var(--bc-accent)" />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.avg_rating}</span>
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {b.business_name} <StatusBadge status={b.is_verified ? "verified" : ""} style={{ transform: 'scale(0.85)' }} />
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--bc-text-muted)', marginBottom: '12px' }}>
                      Prop: {b.name} &bull; {b.years_experience} years exp
                    </p>
                    <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.95rem', marginBottom: '16px', height: '60px', overflow: 'hidden' }}>
                      {b.bio}
                    </p>
                    <div style={{ borderTop: '1px solid var(--bc-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--bc-text-muted)', textTransform: 'uppercase' }}>Min - Max Budget</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                          <CurrencyDisplay amountMin={b.budget_min} amountMax={b.budget_max} />
                        </div>
                      </div>
                      <span style={{ color: 'var(--bc-primary-light)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        View Profile <ExternalLink size={12} />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Projects list */}
        <section>
          <h2>Open Construction Leads</h2>
          <p style={{ color: 'var(--bc-text-secondary)', marginBottom: '20px' }}>Jobs seeking estimations in Hyderabad</p>

          {loading ? (
            <p>Loading projects...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {projects.map(p => (
                <Link to={`/projects/${p.id}`} key={p.id} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <Card hoverLift>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--bc-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={14} /> {p.project_type} &bull; <MapPin size={12} /> {p.location}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{p.title}</h3>
                    <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>{p.description}</p>
                    
                    <div style={{
                      backgroundColor: 'var(--bc-bg-primary)',
                      borderRadius: 'var(--bc-radius-sm)',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--bc-text-primary)', fontWeight: 600 }}>
                        Budget: <CurrencyDisplay amountMin={p.budget_min} amountMax={p.budget_max} />
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--bc-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {p.desired_timeline}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <PageLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/builders" element={<BuildersSearch />} />
          <Route path="/builders/:id" element={<BuilderProfileDetail />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          
          {/* Protected Dashboards for customer, builder, and admin */}
          <Route 
            path="/dashboard/customer" 
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/builder" 
            element={
              <ProtectedRoute allowedRole="builder">
                <BuilderDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/builder/edit" 
            element={
              <ProtectedRoute allowedRole="builder">
                <BuilderProfileEdit />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:id/tracking" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'builder']}>
                <ProjectTracking />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </PageLayout>
    </BrowserRouter>
  );
}

export default App;

