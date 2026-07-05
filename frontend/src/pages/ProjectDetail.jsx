import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, StatusBadge, CurrencyDisplay, Spinner, EmptyState, BuilderCard } from '../components/ui';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Layers, 
  Check, 
  UserPlus, 
  ChevronRight, 
  Star,
  CheckCircle2,
  FileCheck2,
  Sparkles
} from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();

  // Data States
  const [project, setProject] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [recommendedBuilders, setRecommendedBuilders] = useState([]);
  const [quoteBudgetChecks, setQuoteBudgetChecks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite builder state
  const [searchQuery, setSearchQuery] = useState('');
  const [foundBuilders, setFoundBuilders] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  const fetchProjectAndQuotes = async () => {
    try {
      // 1. Fetch project details
      const projRes = await fetch(`${API_BASE_URL}/api/projects/${id}`);
      if (!projRes.ok) {
        throw new Error('Project listing not found');
      }
      const projData = await projRes.json();
      setProject(projData);

      // 2. Fetch recommended builders
      const recRes = await fetch(`${API_BASE_URL}/api/projects/${id}/recommended-builders`);
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendedBuilders(recData);
      }

      // 3. Fetch quotes (if authenticated)
      if (user) {
        const quotesRes = await apiRequest(`/api/projects/${id}/quotes`);
        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          setQuotes(quotesData);

          // Fetch budget comparison checks for each bid cost
          const checks = {};
          await Promise.all(
            quotesData.filter(q => q.status !== 'invited').map(async (q) => {
              try {
                const checkRes = await apiRequest(`/api/projects/${id}/budget-check`, {
                  method: 'POST',
                  body: JSON.stringify({ amount: q.cost })
                });
                if (checkRes.ok) {
                  const checkData = await checkRes.json();
                  checks[q.id] = checkData.status;
                }
              } catch (e) {
                console.error(e);
              }
            })
          );
          setQuoteBudgetChecks(checks);
        }
      }
    } catch (err) {
      setError(err.message || 'Error fetching details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndQuotes();
  }, [id, user]);

  // Search builders to invite
  const handleBuilderSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setInviteSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/builders/search?location=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out builders already in quotes list
        const quotedBuilderIds = quotes.map(q => q.builder_id);
        const uninvited = (data.builders || []).filter(b => !quotedBuilderIds.includes(b.user_id));
        setFoundBuilders(uninvited);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Invite builder
  const handleInviteBuilder = async (builderId) => {
    setInviteSuccess('');
    try {
      const res = await apiRequest(`/api/projects/${id}/request-quote`, {
        method: 'POST',
        body: JSON.stringify({ builder_id: builderId })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Invitation failed');
      }

      setInviteSuccess('Builder invited successfully!');
      setFoundBuilders(foundBuilders.filter(b => b.user_id !== builderId));
      fetchProjectAndQuotes(); // reload quotes list
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  // Accept Quote
  const handleAcceptQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to hire this builder and reject all other quotes?')) {
      return;
    }

    try {
      const res = await apiRequest(`/api/quotes/${quoteId}/accept`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Acceptance action failed');
      }

      // Reload data
      fetchProjectAndQuotes();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--bc-text-secondary)' }}><Spinner size="lg" /></div>;
  }

  if (error || !project) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <Card>
          <h2>Project Not Found</h2>
          <p style={{ color: 'var(--bc-text-secondary)', marginBottom: '24px' }}>{error || 'Requested project lead does not exist.'}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </Button>
        </Card>
      </div>
    );
  }

  const isOwner = user && project.customer_id === user.id;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Back link */}
      <button 
        onClick={() => navigate(-1)}
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
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Project details card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start', width: 'fit-content', marginBottom: '8px' }}>
                  <Layers size={12} /> {project.project_type}
                </span>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--bc-primary-dark)', margin: '4px 0 8px 0' }}>
                  {project.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--bc-text-secondary)', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} color="var(--bc-primary-light)" /> {project.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} color="var(--bc-primary-light)" /> {project.desired_timeline}
                  </span>
                </div>
              </div>
              <StatusBadge status={project.status} />
            </div>

            <div style={{ borderTop: '1px solid var(--bc-border)', paddingTop: '20px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '10px' }}>Project Specification</h3>
              <p style={{ color: 'var(--bc-text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                {project.description}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)', textTransform: 'uppercase' }}>Target Budget Range</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--bc-primary-dark)', marginTop: '4px' }}>
                <CurrencyDisplay amountMin={project.budget_min} amountMax={project.budget_max} />
              </div>
            </div>
          </Card>

          {/* Recommended Builders Section */}
          <section>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={22} color="var(--bc-accent)" /> Recommended Local Builders
            </h2>
            {recommendedBuilders.length === 0 ? (
              <Card style={{ padding: '30px', textAlign: 'center', border: '1px dashed var(--bc-border)' }}>
                <p style={{ color: 'var(--bc-text-secondary)' }}>No recommendations found matching your project specifications.</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {recommendedBuilders.map((b) => (
                  <div key={b.user_id} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      zIndex: 10,
                      backgroundColor: 'var(--bc-accent)',
                      color: 'var(--bc-primary-dark)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 'var(--bc-radius-sm)',
                      boxShadow: 'var(--bc-shadow-sm)'
                    }}>
                      {b.match_score}% Smart Match
                    </div>
                    <BuilderCard builder={b} onClick={() => navigate(`/builders/${b.user_id}`)} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quotes Comparison Grid (Strictly for Customer owner) */}
          {isOwner && (
            <section>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={22} color="var(--bc-primary-light)" /> Bid Comparison Panel
              </h2>
              {quotes.length === 0 ? (
                <Card style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--bc-border)' }}>
                  <p style={{ color: 'var(--bc-text-secondary)', marginBottom: '16px' }}>No quotes submitted yet.</p>
                </Card>
              ) : (
                <Card style={{ padding: '0', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bc-bg-tertiary)', borderBottom: '1px solid var(--bc-border)' }}>
                        <th style={thStyle}>Builder Firm</th>
                        <th style={thStyle}>Quoted Bid (INR)</th>
                        <th style={thStyle}>Est. Timeline</th>
                        <th style={thStyle}>Materials & Brand Info</th>
                        <th style={thStyle}>Warranty Terms</th>
                        <th style={thStyle}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((q) => (
                        <tr key={q.id} style={{ borderBottom: '1px solid var(--bc-border)', backgroundColor: q.status === 'accepted' ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                          <td style={tdStyle}>
                            <Link to={`/builders/${q.builder_id}`} style={{ fontWeight: 600, color: 'var(--bc-primary-light)', textDecoration: 'none' }}>
                              {q.builder_name}
                            </Link>
                            <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)', marginTop: '2px' }}>
                              Source: {q.source === 'invited' ? 'Direct Invite' : 'Open Bid'}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            {q.status === 'invited' ? (
                              <span style={{ color: 'var(--bc-text-muted)', fontStyle: 'italic' }}>Pending submission</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <strong style={{ color: 'var(--bc-primary-dark)' }}>
                                  <CurrencyDisplay amountMin={q.cost} />
                                </strong>
                                {/* Smart budget heuristic flag indicator */}
                                {quoteBudgetChecks[q.id] && (
                                  <span className={`badge ${
                                    quoteBudgetChecks[q.id] === 'within_range' ? 'badge-success' :
                                    quoteBudgetChecks[q.id] === 'above_range' ? 'badge-warning' :
                                    quoteBudgetChecks[q.id] === 'below_range' ? 'badge-info' : 'badge-secondary'
                                  }`} style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', width: 'fit-content', whiteSpace: 'nowrap' }}>
                                    {quoteBudgetChecks[q.id] === 'within_range' ? 'Smart Match: Fair Price' :
                                     quoteBudgetChecks[q.id] === 'above_range' ? 'Smart Match: High Bid' :
                                     quoteBudgetChecks[q.id] === 'below_range' ? 'Smart Match: Low Bid' : 'Smart Match: New category'}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={tdStyle}>{q.timeline_estimate}</td>
                          <td style={tdStyle} title={q.materials_details}>
                            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {q.materials_details}
                            </span>
                          </td>
                          <td style={tdStyle}>{q.warranty_details}</td>
                          <td style={tdStyle}>
                            {q.status === 'accepted' ? (
                              <span style={{ color: 'var(--bc-success)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <Check size={14} /> Accepted
                              </span>
                            ) : q.status === 'rejected' ? (
                              <span style={{ color: 'var(--bc-text-muted)' }}>Rejected</span>
                            ) : q.status === 'invited' ? (
                              <span style={{ color: 'var(--bc-text-muted)', fontSize: '0.8rem' }}>Awaiting Bid</span>
                            ) : project.status === 'hired' ? (
                              <span style={{ color: 'var(--bc-text-muted)' }}>-</span>
                            ) : (
                              <Button variant="primary" size="sm" onClick={() => handleAcceptQuote(q.id)}>
                                Accept
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </section>
          )}
        </div>

        {/* Sidebar panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* General Stats Card */}
          <Card>
            <h3 style={{ borderBottom: '1px solid var(--bc-border)', paddingBottom: '8px', marginBottom: '16px' }}>Info Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)' }}>Project Status</div>
                <div style={{ marginTop: '4px' }}><StatusBadge status={project.status} /></div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)' }}>Total Bids Received</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--bc-primary-dark)', marginTop: '2px' }}>
                  {quotes.filter(q => q.status !== 'invited').length}
                </div>
              </div>
              
              {/* If project is hired/active, allow tracking */}
              {(project.status === 'hired' || project.status === 'in_progress' || project.status === 'completed') && (
                <div style={{ marginTop: '8px', borderTop: '1px solid var(--bc-border)', paddingTop: '16px' }}>
                  <Link to={`/projects/${project.id}/tracking`} style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
                    <Button variant="primary" style={{ width: '100%' }}>
                      Track Project Workspace
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>


          {/* Builder Invite Panel (strictly for Customer owner when project is open) */}
          {isOwner && project.status === 'open' && (
            <Card>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', marginBottom: '12px' }}>
                <UserPlus size={16} /> Direct Builder Invite
              </h3>
              
              {inviteSuccess && (
                <div style={{ color: 'var(--bc-success)', backgroundColor: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: 'var(--bc-radius-sm)', fontSize: '0.8rem', marginBottom: '12px' }}>
                  {inviteSuccess}
                </div>
              )}

              <form onSubmit={handleBuilderSearch} style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Location, e.g. Madhapur"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--bc-radius-sm)',
                    border: '1px solid var(--bc-border)',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bc-bg-secondary)',
                    color: 'var(--bc-text-primary)'
                  }}
                />
                <Button type="submit" variant="primary" size="sm" loading={searching}>
                  Search
                </Button>
              </form>

              {foundBuilders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {foundBuilders.map((b) => (
                    <div key={b.user_id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: 'var(--bc-radius-sm)',
                      backgroundColor: 'var(--bc-bg-tertiary)',
                      border: '1px solid var(--bc-border)'
                    }}>
                      <div style={{ minWidth: '0', flex: 1, marginRight: '8px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.business_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Star size={10} fill="var(--bc-accent)" color="var(--bc-accent)" /> {b.avg_rating} &bull; {b.years_experience} yrs
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleInviteBuilder(b.user_id)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        Invite
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

        </div>

      </div>
    </div>
  );
};

// CSS styles
const thStyle = {
  padding: '12px 16px',
  fontWeight: 600,
  fontSize: '0.85rem',
  color: 'var(--bc-text-secondary)',
  borderBottom: '1px solid var(--bc-border)'
};

const tdStyle = {
  padding: '16px',
  fontSize: '0.9rem',
  color: 'var(--bc-text-primary)',
  verticalAlign: 'middle'
};

export default ProjectDetail;

