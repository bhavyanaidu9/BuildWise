import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, ProjectCard, EmptyState, Spinner } from '../components/ui';
import { Plus, ListCollapse, FilePlus2, CheckCircle2 } from 'lucide-react';

const CustomerDashboard = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();

  // Page States
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal Posting States
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState('residential');
  const [location, setLocation] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [desiredTimeline, setDesiredTimeline] = useState('');
  const [description, setDescription] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const fetchMyProjects = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        throw new Error('Failed to retrieve your project list');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyProjects();
    }
  }, [user]);

  const handlePostProject = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPostError('');

    const bMin = parseInt(budgetMin);
    const bMax = parseInt(budgetMax);

    if (bMin > bMax) {
      setPostError('Minimum budget cannot be greater than maximum budget');
      setPosting(false);
      return;
    }

    const payload = {
      title,
      project_type: projectType,
      location,
      budget_min: bMin,
      budget_max: bMax,
      desired_timeline: desiredTimeline,
      description
    };

    try {
      const res = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to submit project');
      }

      // Add to list and close modal
      const newProj = await res.json();
      setProjects([newProj, ...projects]);
      setModalOpen(false);
      
      // Reset fields
      setTitle('');
      setProjectType('residential');
      setLocation('');
      setBudgetMin('');
      setBudgetMax('');
      setDesiredTimeline('');
      setDescription('');
    } catch (err) {
      setPostError(err.message);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--bc-text-secondary)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--bc-primary-dark)' }}>Customer Dashboard</h1>
          <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.95rem' }}>
            Manage construction listings, view quotes, and track builder assignments.
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Post a Project
        </Button>
      </div>

      {error && (
        <div style={{ color: 'var(--bc-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: 'var(--bc-radius-sm)', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Projects list */}
      <section>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListCollapse size={20} color="var(--bc-primary-light)" /> My Active Listings
        </h2>

        {projects.length === 0 ? (
          <EmptyState
            icon="🏗️"
            title="No Projects Posted Yet"
            description="Create a construction lead to invite local builders and receive bid estimations."
            actionLabel="Post Your First Project"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {projects.map((proj) => (
              <ProjectCard
                key={proj.id}
                project={proj}
                role="customer"
                onClick={() => navigate(`/projects/${proj.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Post Project Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPostError(''); }}
        title="Post New Construction Project"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); setPostError(''); }}>Cancel</Button>
            <Button variant="primary" onClick={handlePostProject} loading={posting}>
              Post Project
            </Button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {postError && (
            <div style={{ color: 'var(--bc-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: 'var(--bc-radius-sm)', fontSize: '0.85rem' }}>
              {postError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Project Title</label>
            <input 
              type="text" 
              required 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. 3BHK Villa Slab Construction" 
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Project Type</label>
              <select 
                value={projectType} 
                onChange={(e) => setProjectType(e.target.value)} 
                style={inputStyle}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="renovation">Renovation</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Location (Hyderabad Area)</label>
              <input 
                type="text" 
                required 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="e.g. Madhapur" 
                style={inputStyle} 
              />
            </div>
          </div>

          {/* Budget Limit Inputs (Raw integers) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Min Budget (₹)</label>
              <input 
                type="number" 
                required 
                min="0"
                value={budgetMin} 
                onChange={(e) => setBudgetMin(e.target.value)} 
                placeholder="e.g. 1000000" 
                style={inputStyle} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Max Budget (₹)</label>
              <input 
                type="number" 
                required 
                min="0"
                value={budgetMax} 
                onChange={(e) => setBudgetMax(e.target.value)} 
                placeholder="e.g. 2500000" 
                style={inputStyle} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Desired Timeline</label>
            <input 
              type="text" 
              required 
              value={desiredTimeline} 
              onChange={(e) => setDesiredTimeline(e.target.value)} 
              placeholder="e.g. 6 Months" 
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Project Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed scope of work: structural dimensions, layouts, brickwork quality, etc."
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--bc-radius-sm)',
                border: '1px solid var(--bc-border)',
                fontSize: '0.9rem',
                backgroundColor: 'var(--bc-bg-secondary)',
                color: 'var(--bc-text-primary)',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 'var(--bc-radius-sm)',
  border: '1px solid var(--bc-border)',
  fontSize: '0.9rem',
  backgroundColor: 'var(--bc-bg-secondary)',
  color: 'var(--bc-text-primary)',
  outline: 'none'
};

export default CustomerDashboard;
