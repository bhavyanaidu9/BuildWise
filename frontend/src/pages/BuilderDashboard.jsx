import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, StatusBadge, CurrencyDisplay, EmptyState, Spinner } from '../components/ui';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Send, 
  Sliders, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

const BuilderDashboard = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('invites'); // invites, marketplace, active

  // Leads Data
  const [leads, setLeans] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bid Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [cost, setCost] = useState('');
  const [timelineEstimate, setTimelineEstimate] = useState('');
  const [materialsDetails, setMaterialsDetails] = useState('');
  const [warrantyDetails, setWarrantyDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Marketplace Filters State (client-side matching)
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [filterMaxBudget, setFilterMaxBudget] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/projects/builder/leads');
      const activeRes = await apiRequest('/api/projects/builder/active');
      if (res.ok) {
        const data = await res.json();
        setLeans(data);
      } else {
        throw new Error('Failed to retrieve project leads');
      }
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveJobs(activeData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  // Handle bid submit
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    const payload = {
      project_id: selectedLead.project_id,
      cost: parseInt(cost),
      timeline_estimate: timelineEstimate,
      materials_details: materialsDetails,
      warranty_details: warrantyDetails
    };

    try {
      const res = await apiRequest('/api/quotes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to submit quote');
      }

      setModalOpen(false);
      
      // Reset Modal fields
      setCost('');
      setTimelineEstimate('');
      setMaterialsDetails('');
      setWarrantyDetails('');
      setSelectedLead(null);
      
      // Reload leads
      fetchLeads();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--bc-text-secondary)' }}><Spinner size="lg" /></div>;
  }

  // Filter leads based on source type
  const invitations = leads.filter(l => l.source === 'invited');
  const openLeads = leads.filter(l => l.source === 'marketplace');

  // Filter open marketplace leads dynamically
  const filteredOpenLeads = openLeads.filter(lead => {
    // 1. Location match
    if (filterLocation.trim() && !lead.location.toLowerCase().includes(filterLocation.toLowerCase().trim())) {
      return false;
    }
    // 2. Specialization match
    if (filterSpecialization && lead.project_type !== filterSpecialization) {
      return false;
    }
    // 3. Budget cap check
    if (filterMaxBudget && lead.budget_max > parseInt(filterMaxBudget)) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--bc-primary-dark)' }}>Builder Dashboard</h1>
          <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.95rem' }}>
            Submit estimations for customer invitations and browse the open construction directory.
          </p>
        </div>
        <Link to="/dashboard/builder/edit">
          <Button variant="outline">Edit Company Profile</Button>
        </Link>
      </div>

      {error && (
        <div style={{ color: 'var(--bc-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: 'var(--bc-radius-sm)', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Tabs Row */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--bc-border)',
        marginBottom: '30px',
        gap: '24px'
      }}>
        <button
          onClick={() => setActiveTab('invites')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'invites' ? '3px solid var(--bc-primary)' : '3px solid transparent',
            color: activeTab === 'invites' ? 'var(--bc-primary-dark)' : 'var(--bc-text-secondary)',
            padding: '12px 6px',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          Direct Invitations
          <span style={{
            backgroundColor: invitations.length > 0 ? 'var(--bc-accent)' : 'var(--bc-bg-tertiary)',
            color: invitations.length > 0 ? 'var(--bc-primary-dark)' : 'var(--bc-text-secondary)',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {invitations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'marketplace' ? '3px solid var(--bc-primary)' : '3px solid transparent',
            color: activeTab === 'marketplace' ? 'var(--bc-primary-dark)' : 'var(--bc-text-secondary)',
            padding: '12px 6px',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          Open Marketplace Leads
          <span style={{
            backgroundColor: openLeads.length > 0 ? 'var(--bc-primary-light)' : 'var(--bc-bg-tertiary)',
            color: openLeads.length > 0 ? '#FFF' : 'var(--bc-text-secondary)',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {openLeads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'active' ? '3px solid var(--bc-primary)' : '3px solid transparent',
            color: activeTab === 'active' ? 'var(--bc-primary-dark)' : 'var(--bc-text-secondary)',
            padding: '12px 6px',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          My Active Contracts
          <span style={{
            backgroundColor: 'var(--bc-success)',
            color: '#FFF',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {activeJobs.length}
          </span>
        </button>
      </div>

      {/* Direct Invitations Tab */}
      {activeTab === 'invites' && (
        <section>
          {invitations.length === 0 ? (
            <EmptyState
              icon="📨"
              title="No Direct Invitations Yet"
              description="Customers can invite you directly from your public directory profile. Keep your bio and portfolio up-to-date to attract more leads!"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {invitations.map((lead) => (
                <Card key={lead.project_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--bc-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Briefcase size={14} /> {lead.project_type} &bull; <MapPin size={12} /> {lead.location}
                    </span>
                    <StatusBadge 
                      status="Direct Invite" 
                      colorMap={{ "direct invite": "warning" }} 
                    />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{lead.title}</h3>
                  <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>{lead.description}</p>
                  
                  <div style={{
                    backgroundColor: 'var(--bc-bg-primary)',
                    borderRadius: 'var(--bc-radius-sm)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--bc-text-muted)', display: 'block', textTransform: 'uppercase' }}>Target Budget Scope</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--bc-primary-dark)' }}>
                        <CurrencyDisplay amountMin={lead.budget_min} amountMax={lead.budget_max} />
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      {lead.quote_status === 'invited' ? (
                        <Button variant="primary" size="sm" onClick={() => { setSelectedLead(lead); setModalOpen(true); }}>
                          Submit Estimation
                        </Button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--bc-text-secondary)' }}>
                            Estimation Submitted: <strong><CurrencyDisplay amountMin={lead.cost} /></strong>
                          </span>
                          <span className="badge badge-success">quoted</span>
                        </div>
                      )}
                      <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${lead.project_id}`)}>
                        Details <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Open Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px', alignItems: 'flex-start' }}>
          
          {/* Marketplace Filter Panel */}
          <aside>
            <Card style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', borderBottom: '1px solid var(--bc-border)', paddingBottom: '10px' }}>
                <Sliders size={16} /> Filters
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Kukatpally"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    style={filterInputStyle}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Project Type</label>
                  <select
                    value={filterSpecialization}
                    onChange={(e) => setFilterSpecialization(e.target.value)}
                    style={filterSelectStyle}
                  >
                    <option value="">All Types</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="renovation">Renovation</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Max Budget Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2000000"
                    value={filterMaxBudget}
                    onChange={(e) => setFilterMaxBudget(e.target.value)}
                    style={filterInputStyle}
                  />
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setFilterLocation(''); setFilterSpecialization(''); setFilterMaxBudget(''); }}
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          </aside>

          {/* Leads Grid */}
          <main>
            {filteredOpenLeads.length === 0 ? (
              <EmptyState
                icon="🏗️"
                title="No Open Leads Match Your Filters"
                description="Try clearing or adjusting your location queries or budget scope."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredOpenLeads.map((lead) => (
                  <Card key={lead.project_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--bc-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Briefcase size={14} /> {lead.project_type} &bull; <MapPin size={12} /> {lead.location}
                      </span>
                      <StatusBadge 
                        status="Open Bid" 
                        colorMap={{ "open bid": "info" }} 
                      />
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{lead.title}</h3>
                    <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>{lead.description}</p>
                    
                    <div style={{
                      backgroundColor: 'var(--bc-bg-primary)',
                      borderRadius: 'var(--bc-radius-sm)',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--bc-text-muted)', display: 'block', textTransform: 'uppercase' }}>Target Budget Scope</span>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--bc-primary-dark)' }}>
                          <CurrencyDisplay amountMin={lead.budget_min} amountMax={lead.budget_max} />
                        </strong>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        {lead.quote_status === null ? (
                          <Button variant="primary" size="sm" onClick={() => { setSelectedLead(lead); setModalOpen(true); }}>
                            Submit Estimation
                          </Button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--bc-text-secondary)' }}>
                              Estimation Submitted: <strong><CurrencyDisplay amountMin={lead.cost} /></strong>
                            </span>
                            <span className="badge badge-success">quoted</span>
                          </div>
                        )}
                        <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${lead.project_id}`)}>
                          Details <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </main>

        </div>
      )}

      {/* Active Contracts Tab */}
      {activeTab === 'active' && (
        <section>
          {activeJobs.length === 0 ? (
            <EmptyState
              icon="🏗️"
              title="No Active Contracts Hired"
              description="Bids and quote invitations that customers accept will be routed here to initiate active tracking."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeJobs.map((job) => (
                <Card key={job.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--bc-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Briefcase size={14} /> {job.project_type} &bull; <MapPin size={12} /> {job.location}
                    </span>
                    <StatusBadge status={job.status} />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{job.title}</h3>
                  <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>{job.description}</p>
                  
                  <div style={{
                    backgroundColor: 'var(--bc-bg-primary)',
                    borderRadius: 'var(--bc-radius-sm)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--bc-text-muted)', display: 'block', textTransform: 'uppercase' }}>Hired Budget Bounds</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--bc-primary-dark)' }}>
                        <CurrencyDisplay amountMin={job.budget_min} amountMax={job.budget_max} />
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Button variant="primary" size="sm" onClick={() => navigate(`/projects/${job.id}/tracking`)}>
                        Track Project Workspace
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${job.id}`)}>
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Submit Bid Modal */}
      {selectedLead && (
        <Modal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSubmitError(''); }}
          title={`Submit Estimation: ${selectedLead.title}`}
          footer={
            <>
              <Button variant="outline" onClick={() => { setModalOpen(false); setSubmitError(''); }}>Cancel</Button>
              <Button variant="primary" onClick={handleBidSubmit} loading={submitting}>
                Submit Estimation
              </Button>
            </>
          }
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {submitError && (
              <div style={{ color: 'var(--bc-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: 'var(--bc-radius-sm)', fontSize: '0.85rem' }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Estimated Cost (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 1800000"
                style={modalInputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Timeline Estimate</label>
              <input
                type="text"
                required
                value={timelineEstimate}
                onChange={(e) => setTimelineEstimate(e.target.value)}
                placeholder="e.g. 5 Months"
                style={modalInputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Materials details & Brands</label>
              <textarea
                required
                rows={3}
                value={materialsDetails}
                onChange={(e) => setMaterialsDetails(e.target.value)}
                placeholder="e.g. Grade A TMT steel, Ultratech cement, standard electrical fittings."
                style={modalTextareaStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Warranty Terms</label>
              <input
                type="text"
                required
                value={warrantyDetails}
                onChange={(e) => setWarrantyDetails(e.target.value)}
                placeholder="e.g. 12 Months Structural Warranty"
                style={modalInputStyle}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// CSS inputs resets
const filterInputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--bc-radius-sm)',
  border: '1px solid var(--bc-border)',
  fontSize: '0.85rem',
  backgroundColor: 'var(--bc-bg-secondary)',
  color: 'var(--bc-text-primary)',
  outline: 'none'
};

const filterSelectStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--bc-radius-sm)',
  border: '1px solid var(--bc-border)',
  fontSize: '0.85rem',
  backgroundColor: 'var(--bc-bg-secondary)',
  color: 'var(--bc-text-primary)',
  cursor: 'pointer',
  outline: 'none'
};

const modalInputStyle = {
  padding: '10px 12px',
  borderRadius: 'var(--bc-radius-sm)',
  border: '1px solid var(--bc-border)',
  fontSize: '0.9rem',
  backgroundColor: 'var(--bc-bg-secondary)',
  color: 'var(--bc-text-primary)',
  outline: 'none',
  width: '100%'
};

const modalTextareaStyle = {
  padding: '10px 12px',
  borderRadius: 'var(--bc-radius-sm)',
  border: '1px solid var(--bc-border)',
  fontSize: '0.9rem',
  backgroundColor: 'var(--bc-bg-secondary)',
  color: 'var(--bc-text-primary)',
  fontFamily: 'inherit',
  resize: 'vertical',
  outline: 'none',
  width: '100%'
};

export default BuilderDashboard;
