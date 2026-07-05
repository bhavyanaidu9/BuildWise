import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, StatusBadge, CurrencyDisplay, Spinner, EmptyState } from '../components/ui';
import { 
  Calendar, 
  FileText, 
  MessageSquare, 
  CreditCard, 
  Plus, 
  Upload, 
  Send, 
  User, 
  Clock, 
  MapPin, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';

const ProjectTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState('milestones'); // milestones, documents, messages, payments

  // Data States
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals States
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDue, setNewMilestoneDue] = useState(new Date().toISOString().split('T')[0]);
  const [savingMilestone, setSavingMilestone] = useState(false);

  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [docType, setDocType] = useState('Contract');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loggingPayment, setLoggingPayment] = useState(false);

  // Review Modal States
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Discussion state
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messageEndRef = useRef(null);

  // Fetch Project details
  const fetchProjectInfo = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        
        // If project completed, check if customer already left a review
        if (data.status === 'completed' && user && user.role === 'customer') {
          // Check if review has been written
          const builderRes = await fetch(`${API_BASE_URL}/api/builders/search?limit=100`);
          if (builderRes.ok) {
            const builderData = await builderRes.json();
            // Fetch this project's accepted quote to see builder ID
            const quotesRes = await apiRequest(`/api/projects/${id}/quotes`);
            if (quotesRes.ok) {
              const quotesData = await quotesRes.json();
              const acceptedQuote = quotesData.find(q => q.status === 'accepted');
              if (acceptedQuote) {
                // Fetch public profile of this builder to check reviews list
                const profileRes = await fetch(`${API_BASE_URL}/api/builders/${acceptedQuote.builder_id}`);
                if (profileRes.ok) {
                  const profileData = await profileRes.json();
                  const existingReview = (profileData.reviews || []).find(r => r.project_id === parseInt(id));
                  if (existingReview) {
                    setHasReviewed(true);
                  }
                }
              }
            }
          }
        }
      } else {
        throw new Error('Project details not found');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch data depending on active tab
  const fetchTabData = async () => {
    if (!user) return;
    try {
      if (activeTab === 'milestones') {
        const res = await apiRequest(`/api/projects/${id}/milestones`);
        if (res.ok) setMilestones(await res.json());
      } else if (activeTab === 'documents') {
        const res = await apiRequest(`/api/projects/${id}/documents`);
        if (res.ok) setDocuments(await res.json());
      } else if (activeTab === 'messages') {
        const res = await apiRequest(`/api/projects/${id}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } else if (activeTab === 'payments') {
        const res = await apiRequest(`/api/projects/${id}/payments`);
        const msRes = await apiRequest(`/api/projects/${id}/milestones`);
        if (res.ok) setPayments(await res.json());
        if (msRes.ok) setMilestones(await msRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch tracking metrics', err);
    }
  };

  // Load project core data on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProjectInfo();
      setLoading(false);
    };
    init();
  }, [id, user]);

  // Sync tab data when tab or project changes
  useEffect(() => {
    if (project) {
      fetchTabData();
    }
  }, [activeTab, project]);

  // Message Polling Effect (every 3 seconds)
  useEffect(() => {
    let interval = null;
    if (project && activeTab === 'messages') {
      const pollMessages = async () => {
        try {
          const res = await apiRequest(`/api/projects/${id}/messages`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      
      interval = setInterval(pollMessages, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, project]);

  // Scroll to bottom of message list on new messages
  useEffect(() => {
    if (activeTab === 'messages' && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle Milestone Addition
  const handleAddMilestone = async (e) => {
    e.preventDefault();
    setSavingMilestone(true);
    try {
      const res = await apiRequest(`/api/projects/${id}/milestones`, {
        method: 'POST',
        body: JSON.stringify({
          title: newMilestoneTitle,
          description: newMilestoneDesc,
          due_date: newMilestoneDue
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create milestone');
      }

      setMilestoneModalOpen(false);
      setNewMilestoneTitle('');
      setNewMilestoneDesc('');
      fetchTabData(); // refresh list
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingMilestone(false);
    }
  };

  // Handle Milestone status change (Done/In Progress/Pending)
  const handleMilestoneStatusChange = async (milestoneId, newStatus) => {
    try {
      const res = await apiRequest(`/api/projects/${id}/milestones/${milestoneId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      
      fetchTabData(); // reload
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Document upload
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadingDoc(true);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('doc_type', docType);

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      setDocumentModalOpen(false);
      setUploadFile(null);
      fetchTabData();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMsg(true);

    try {
      const res = await apiRequest(`/api/projects/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage.trim() })
      });

      if (res.ok) {
        setNewMessage('');
        const sentData = await res.json();
        setMessages(prev => [...prev, {
          id: sentData.id,
          project_id: parseInt(id),
          sender_id: user.id,
          sender_name: user.name,
          sender_role: user.role,
          content: sentData.content,
          sent_at: sentData.sent_at
        }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  // Handle Log Payment
  const handleLogPayment = async (e) => {
    e.preventDefault();
    setLoggingPayment(true);

    const mid = selectedMilestoneId ? parseInt(selectedMilestoneId) : null;
    const amt = parseInt(paymentAmount);

    try {
      const res = await apiRequest(`/api/projects/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          milestone_id: mid,
          amount: amt
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to record payment');
      }

      setPaymentModalOpen(false);
      setSelectedMilestoneId('');
      setPaymentAmount('');
      fetchTabData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoggingPayment(false);
    }
  };

  // Complete project
  const handleCompleteProject = async () => {
    if (!window.confirm("Mark construction works on this project as finished? This allows logging reviews.")) return;
    try {
      const res = await apiRequest(`/api/projects/${id}/complete`, {
        method: 'POST'
      });
      if (res.ok) {
        alert("Project completed successfully!");
        fetchProjectInfo();
      } else {
        const err = await res.json();
        alert(err.detail || "Error completing project");
      }
    } catch (e) {
      alert("Error completing project: " + e.message);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          project_id: parseInt(id),
          rating: parseInt(reviewRating),
          comment: reviewComment
        })
      });

      if (res.ok) {
        alert("Review submitted successfully!");
        setHasReviewed(true);
        setReviewModalOpen(false);
        setReviewComment('');
        fetchProjectInfo(); // reload details
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to submit review");
      }
    } catch (e) {
      alert("Failed to submit review: " + e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--bc-text-secondary)' }}><Spinner size="lg" /></div>;
  }

  if (error || !project) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <Card>
          <h2>Tracking Not Available</h2>
          <p style={{ color: 'var(--bc-text-secondary)', marginBottom: '24px' }}>{error || 'Unable to access tracking controls.'}</p>
          <Button variant="outline" onClick={() => navigate('/')}>Back to Directory</Button>
        </Card>
      </div>
    );
  }

  const isCustomer = user && user.role === 'customer';

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', color: 'var(--bc-text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--bc-primary-dark)', margin: '4px 0' }}>{project.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--bc-text-secondary)', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {project.location}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {project.desired_timeline}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isCustomer && (project.status === 'hired' || project.status === 'in_progress') && (
              <Button variant="outline" size="sm" onClick={handleCompleteProject}>
                Mark Completed
              </Button>
            )}
            <StatusBadge status={project.status} />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--bc-text-muted)' }}>Project Hired Workspace</span>
        </div>
      </div>

      {/* Review Submission Card Banner */}
      {project.status === 'completed' && isCustomer && (
        <Card style={{
          backgroundColor: 'rgba(16,185,129,0.08)',
          border: '1px solid var(--bc-success)',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h4 style={{ color: 'var(--bc-primary-dark)', fontSize: '1.1rem', marginBottom: '4px' }}>Project Completed Successfully!</h4>
            <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.9rem' }}>Share your building review and rate the contractor's craftsmanship.</p>
          </div>
          {hasReviewed ? (
            <span style={{ color: 'var(--bc-success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={16} /> Review Submitted
            </span>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setReviewModalOpen(true)}>Write Review</Button>
          )}
        </Card>
      )}

      {/* Tabs list */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--bc-border)',
        marginBottom: '24px',
        gap: '24px'
      }}>
        {[
          { id: 'milestones', label: 'Milestones', icon: <Calendar size={16} /> },
          { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
          { id: 'messages', label: 'Discussion Log', icon: <MessageSquare size={16} /> },
          { id: 'payments', label: 'Milestone Payments', icon: <CreditCard size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid var(--bc-primary)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--bc-primary-dark)' : 'var(--bc-text-secondary)',
              padding: '12px 6px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Panel */}
      <div style={{ minHeight: '300px' }}>
        
        {/* MILESTONES TAB */}
        {activeTab === 'milestones' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Project Milestones Checkpoints</h2>
              <Button variant="primary" size="sm" onClick={() => setMilestoneModalOpen(true)}>
                <Plus size={14} /> Add Milestone
              </Button>
            </div>

            {milestones.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No Milestones Setup Yet"
                description="List specific building stages (foundation, brickwork, slab casting) to align expectations."
                actionLabel="Create Checklist Milestone"
                onAction={() => setMilestoneModalOpen(true)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {milestones.map((m) => (
                  <Card key={m.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '0' }}>
                        <h4 style={{ fontSize: '1.1rem', color: 'var(--bc-primary-dark)', marginBottom: '6px' }}>{m.title}</h4>
                        <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>{m.description}</p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--bc-text-muted)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> Due: {m.due_date}
                          </span>
                          {m.completed_at && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--bc-success)' }}>
                              <CheckCircle size={12} /> Completed: {new Date(m.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dropdown status update for builder and customer */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <StatusBadge status={m.status} />
                        <select
                          value={m.status}
                          onChange={(e) => handleMilestoneStatusChange(m.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid var(--bc-border)',
                            borderRadius: 'var(--bc-radius-sm)',
                            fontSize: '0.85rem',
                            backgroundColor: 'var(--bc-bg-secondary)',
                            color: 'var(--bc-text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done / Completed</option>
                        </select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Project Blueprint Documents</h2>
              <Button variant="primary" size="sm" onClick={() => setDocumentModalOpen(true)}>
                <Upload size={14} /> Upload Document
              </Button>
            </div>

            {documents.length === 0 ? (
              <EmptyState
                icon="📁"
                title="No Documents Uploaded"
                description="Upload agreements, layouts, schedules, or architectural blueprints."
                actionLabel="Upload Blueprint Document"
                onAction={() => setDocumentModalOpen(true)}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {documents.map((d) => (
                  <Card key={d.id} hoverLift>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <FileText size={28} color="var(--bc-primary-light)" style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: '0', flex: 1 }}>
                        <h4 style={{ fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.file_name}>
                          {d.file_name}
                        </h4>
                        <span className="badge badge-info" style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.7rem' }}>
                          {d.doc_type}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--bc-text-muted)', borderTop: '1px solid var(--bc-border)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>By: {d.uploaded_by_name}</span>
                      <a 
                        href={`${API_BASE_URL}${d.file_url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          fontWeight: 600,
                          color: 'var(--bc-primary-light)',
                          textDecoration: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Download
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '500px', border: '1px solid var(--bc-border)', borderRadius: 'var(--bc-radius-lg)', overflow: 'hidden', backgroundColor: 'var(--bc-bg-secondary)' }}>
            
            {/* Scrollable messages history */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--bc-text-muted)' }}>
                  <MessageSquare size={36} style={{ marginBottom: '8px' }} />
                  <p>Send a message to initiate discussion thread.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    style={{
                      alignSelf: user && msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--bc-text-muted)', alignSelf: user && msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                      {msg.sender_name} ({msg.sender_role})
                    </span>
                    <div style={{
                      backgroundColor: user && msg.sender_id === user.id ? 'var(--bc-primary)' : 'var(--bc-bg-tertiary)',
                      color: user && msg.sender_id === user.id ? '#FFF' : 'var(--bc-text-primary)',
                      padding: '10px 14px',
                      borderRadius: 'var(--bc-radius-md)',
                      fontSize: '0.92rem',
                      lineHeight: 1.4,
                      boxShadow: 'var(--bc-shadow-sm)'
                    }}>
                      {msg.content}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--bc-text-muted)', alignSelf: 'flex-end' }}>
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSendMessage} style={{ borderTop: '1px solid var(--bc-border)', padding: '16px', display: 'flex', gap: '10px', backgroundColor: 'var(--bc-bg-primary)' }}>
              <input
                type="text"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sendingMsg}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--bc-radius-sm)',
                  border: '1px solid var(--bc-border)',
                  outline: 'none',
                  fontSize: '0.92rem',
                  backgroundColor: 'var(--bc-bg-secondary)',
                  color: 'var(--bc-text-primary)'
                }}
              />
              <Button type="submit" variant="primary" loading={sendingMsg}>
                <Send size={16} /> Send
              </Button>
            </form>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Milestone Payment Disbursals</h2>
              {isCustomer && (
                <Button variant="primary" size="sm" onClick={() => setPaymentModalOpen(true)}>
                  <CreditCard size={14} /> Log Disbursal
                </Button>
              )}
            </div>

            {/* Pay now dashboard actions for pending done milestones */}
            {isCustomer && milestones.filter(m => m.status === 'done' && !payments.some(p => p.milestone_id === m.id)).length > 0 && (
              <div style={{
                backgroundColor: 'rgba(244,163,0,0.1)',
                border: '1px solid var(--bc-accent)',
                borderRadius: 'var(--bc-radius-md)',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <AlertCircle color="var(--bc-accent)" />
                  <div>
                    <strong>Unpaid Finished Milestones!</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--bc-text-secondary)', marginTop: '2px' }}>
                      Builders completed milestones that seek customer payment logs.
                    </div>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => setPaymentModalOpen(true)}>
                  Disburse Payment Now
                </Button>
              </div>
            )}

            {payments.length === 0 ? (
              <EmptyState
                icon="💳"
                title="No Payments Logged"
                description="Customers disburse payments corresponding to milestones completion."
                actionLabel={isCustomer ? "Log Disbursal" : undefined}
                onAction={isCustomer ? () => setPaymentModalOpen(true) : undefined}
              />
            ) : (
              <Card style={{ padding: '0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bc-bg-tertiary)', borderBottom: '1px solid var(--bc-border)' }}>
                      <th style={thStyle}>Milestone Target</th>
                      <th style={thStyle}>Disbursed Amount</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--bc-border)' }}>
                        <td style={tdStyle}>{p.milestone_title}</td>
                        {/* Currency values on this page MUST render via CurrencyDisplay */}
                        <td style={tdStyle}>
                          <strong>
                            <CurrencyDisplay amountMin={p.amount} />
                          </strong>
                        </td>
                        <td style={tdStyle}><StatusBadge status={p.status} /></td>
                        <td style={tdStyle}>
                          {p.paid_at ? new Date(p.paid_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

      </div>

      {/* 1. Add Milestone Modal */}
      <Modal
        isOpen={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        title="Add Project Milestone Checkpoint"
        footer={
          <>
            <Button variant="outline" onClick={() => setMilestoneModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddMilestone} loading={savingMilestone}>
              Add Milestone
            </Button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Milestone Title</label>
            <input
              type="text"
              required
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="e.g. Ground Foundation Slab"
              style={modalInputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Completion Date Target</label>
            <input
              type="date"
              required
              value={newMilestoneDue}
              onChange={(e) => setNewMilestoneDue(e.target.value)}
              style={modalInputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description / Deliverables Scope</label>
            <textarea
              rows={3}
              value={newMilestoneDesc}
              onChange={(e) => setNewMilestoneDesc(e.target.value)}
              placeholder="e.g. Steel grids reinforcement check, concrete grade concrete pouring."
              style={modalTextareaStyle}
            />
          </div>
        </form>
      </Modal>

      {/* 2. Upload Document Modal */}
      <Modal
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        title="Upload Project Contract / Blueprint"
        footer={
          <>
            <Button variant="outline" onClick={() => setDocumentModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleDocumentUpload} loading={uploadingDoc} disabled={!uploadFile}>
              Upload File
            </Button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Document Category</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={modalInputStyle}
            >
              <option value="Contract">Bilateral Hired Contract</option>
              <option value="Blueprint">Engineering Layout Blueprint</option>
              <option value="Schedule">Project Work Schedule</option>
              <option value="Invoice">Builder Invoice</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select File</label>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
              style={{
                padding: '10px',
                border: '1px solid var(--bc-border)',
                borderRadius: 'var(--bc-radius-sm)',
                backgroundColor: 'var(--bc-bg-secondary)'
              }}
            />
          </div>
        </form>
      </Modal>

      {/* 3. Log Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Log Payment Disbursal"
        footer={
          <>
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleLogPayment} loading={loggingPayment}>
              Log Payment
            </Button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Milestone Reference</label>
            <select
              value={selectedMilestoneId}
              onChange={(e) => setSelectedMilestoneId(e.target.value)}
              style={modalInputStyle}
            >
              <option value="">General Project Disbursal (No Milestone)</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>{m.title} ({m.status})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Payment Amount (₹)</label>
            <input
              type="number"
              required
              min="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="e.g. 350000"
              style={modalInputStyle}
            />
          </div>
        </form>
      </Modal>

      {/* 4. Write Builder Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Log Builder Construction Review"
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmitReview} loading={submittingReview} disabled={!reviewComment.trim()}>
              Submit Review
            </Button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rating Score</label>
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(e.target.value)}
              style={modalInputStyle}
            >
              <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional quality)</option>
              <option value="4">⭐⭐⭐⭐ (4 - Very Good work)</option>
              <option value="3">⭐⭐⭐ (3 - Good / Average)</option>
              <option value="2">⭐⭐ (2 - Needs improvement)</option>
              <option value="1">⭐ (1 - Unacceptable craftsmanship)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Review Comment</label>
            <textarea
              required
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Describe construction speed, materials, accuracy of drawings, and general behavior..."
              style={modalTextareaStyle}
            />
          </div>
        </form>
      </Modal>

    </div>
  );
};

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

export default ProjectTracking;

