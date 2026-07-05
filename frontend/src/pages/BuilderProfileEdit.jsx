import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal } from '../components/ui';
import { 
  Building, 
  MapPin, 
  Plus, 
  X, 
  Upload, 
  Save, 
  Briefcase, 
  Award, 
  DollarSign, 
  FileText, 
  User, 
  Phone,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

const HYDERABAD_AREAS = [
  "Hyderabad", "Secunderabad", "Kukatpally", "Gachibowli", 
  "Madhapur", "Kondapur", "Miyapur", "Banjara Hills", 
  "Jubilee Hills", "Begumpet", "Nampally", "Ameerpet"
];

const BuilderProfileEdit = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();

  // Profile fields state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [specialization, setSpecialization] = useState('residential');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [areaInput, setAreaInput] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [bio, setBio] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [portfolio, setPortfolio] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Portfolio Item Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [portTitle, setPortTitle] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [portDate, setPortDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [portError, setPortError] = useState('');

  // Fetch existing profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiRequest(`/api/builders/${user.user_id || user.id || 1}`);
        if (res.ok) {
          const data = await res.json();
          setName(data.name || '');
          setPhone(data.phone || '');
          setBusinessName(data.business_name || '');
          setSpecialization(data.specialization || 'residential');
          setYearsExperience(data.years_experience || 0);
          setServiceAreas(data.service_areas || []);
          setBudgetMin(data.budget_min || '');
          setBudgetMax(data.budget_max || '');
          setBio(data.bio || '');
          setIsVerified(data.is_verified || false);
          setPortfolio(data.portfolio || []);
        } else {
          // If profile is not found or error, initialize defaults
          setName(user.name || '');
          setPhone(user.phone || '');
        }
      } catch (err) {
        setError('Failed to fetch profile details.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Handle service area tag actions
  const handleAddArea = (areaToAdd) => {
    const cleanArea = areaToAdd.trim();
    if (cleanArea && !serviceAreas.includes(cleanArea)) {
      setServiceAreas([...serviceAreas, cleanArea]);
    }
    setAreaInput('');
  };

  const handleRemoveArea = (indexToRemove) => {
    setServiceAreas(serviceAreas.filter((_, idx) => idx !== indexToRemove));
  };

  // Image Upload to Backend local storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setPortError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Direct call because we are sending multipart/form-data
      const res = await fetch(`${API_BASE_URL}/api/builders/portfolio/upload`, {
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

      const uploadData = await res.json();
      setUploadedUrl(uploadData.url);
    } catch (err) {
      setPortError(err.message || 'Image upload failed. Supports JPG/PNG.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save new portfolio item to database
  const handleAddPortfolioItem = async (e) => {
    e.preventDefault();
    if (!uploadedUrl) {
      setPortError('Please upload an image first');
      return;
    }

    try {
      const res = await apiRequest('/api/builders/portfolio/item', {
        method: 'POST',
        body: JSON.stringify({
          image_url: uploadedUrl,
          title: portTitle,
          description: portDesc,
          project_date: portDate
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save portfolio item');
      }

      const newItem = await res.json();
      setPortfolio([...portfolio, newItem]);
      
      // Reset Modal fields
      setPortTitle('');
      setPortDesc('');
      setUploadedUrl('');
      setModalOpen(false);
    } catch (err) {
      setPortError(err.message);
    }
  };

  // Save Profile fields
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      business_name: businessName,
      specialization,
      years_experience: parseInt(yearsExperience) || 0,
      service_areas: serviceAreas,
      budget_min: parseInt(budgetMin) || 0,
      budget_max: parseInt(budgetMax) || 0,
      bio,
      name,
      phone
    };

    try {
      const res = await apiRequest('/api/builders/me', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save profile changes');
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--bc-text-secondary)' }}>Loading profile fields...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--bc-primary-dark)' }}>Edit Builder Profile</h1>
          <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.9rem' }}>
            Set up your public directory page, budget limits, and showcase portfolio projects.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/builders/${user.user_id || user.id}`)}>
          View My Public Profile
        </Button>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--bc-danger)',
          borderRadius: 'var(--bc-radius-sm)',
          padding: '12px',
          color: 'var(--bc-danger)',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          {error}
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
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Core Profile Edit Card */}
        <form onSubmit={handleSaveProfile}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Primary Contact Details */}
            <div>
              <h3 style={{ borderBottom: '1px solid var(--bc-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                Contact Representative
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>Representative Name</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-text-muted)' }}>
                      <User size={16} />
                    </span>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>Contact Number</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-text-muted)' }}>
                      <Phone size={16} />
                    </span>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div>
              <h3 style={{ borderBottom: '1px solid var(--bc-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                Business Credentials
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>Business Name</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-text-muted)' }}>
                      <Building size={16} />
                    </span>
                    <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>Specialization</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-text-muted)' }}>
                        <Briefcase size={16} />
                      </span>
                      <select 
                        value={specialization} 
                        onChange={(e) => setSpecialization(e.target.value)} 
                        style={{ ...inputStyle, paddingLeft: '40px', WebkitAppearance: 'none' }}
                      >
                        <option value="residential">Residential Construction</option>
                        <option value="commercial">Commercial Spaces</option>
                        <option value="renovation">Renovations & Overhauls</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>Years of Experience</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bc-text-muted)' }}>
                        <Award size={16} />
                      </span>
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        value={yearsExperience} 
                        onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)} 
                        style={inputStyle} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Areas (Tag Input) */}
            <div>
              <h3 style={{ borderBottom: '1px solid var(--bc-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                Service Locations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--bc-text-secondary)' }}>
                  Type an area name (e.g. Kukatpally, Gachibowli) or choose from suggestions and press Enter:
                </label>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  border: '1px solid var(--bc-border)',
                  padding: '8px 12px',
                  borderRadius: 'var(--bc-radius-sm)',
                  backgroundColor: 'var(--bc-bg-secondary)',
                  minHeight: '46px'
                }}>
                  {serviceAreas.map((area, idx) => (
                    <span key={idx} style={{
                      backgroundColor: 'var(--bc-bg-tertiary)',
                      color: 'var(--bc-text-primary)',
                      padding: '4px 10px',
                      borderRadius: 'var(--bc-radius-sm)',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 600
                    }}>
                      {area}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveArea(idx)} />
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={serviceAreas.length === 0 ? "e.g. Madhapur" : ""}
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddArea(areaInput);
                      }
                    }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      fontSize: '0.95rem',
                      minWidth: '100px',
                      backgroundColor: 'transparent'
                    }}
                  />
                </div>
                {/* Suggestions List */}
                {areaInput && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: '8px',
                    border: '1px solid var(--bc-border)',
                    borderRadius: 'var(--bc-radius-sm)',
                    backgroundColor: 'var(--bc-bg-secondary)'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--bc-text-muted)', width: '100%', marginBottom: '4px' }}>Suggestions:</span>
                    {HYDERABAD_AREAS.filter(a => a.toLowerCase().includes(areaInput.toLowerCase()) && !serviceAreas.includes(a)).map((area, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddArea(area)}
                        style={{
                          border: '1px solid var(--bc-border)',
                          backgroundColor: 'var(--bc-bg-primary)',
                          padding: '4px 8px',
                          borderRadius: 'var(--bc-radius-sm)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        + {area}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Budget Ranges (Int inputs in ₹) */}
            <div>
              <h3 style={{ borderBottom: '1px solid var(--bc-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                Project Limits (INR)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>Minimum Project size (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={budgetMin} 
                    onChange={(e) => setBudgetMin(parseInt(e.target.value) || 0)} 
                    placeholder="e.g. 500000" 
                    style={inputStyleRaw} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>Maximum Project size (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={budgetMax} 
                    onChange={(e) => setBudgetMax(parseInt(e.target.value) || 0)} 
                    placeholder="e.g. 5000000" 
                    style={inputStyleRaw} 
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ borderBottom: '1px solid var(--bc-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                About Company
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>Company Overview</label>
                <textarea
                  required
                  rows={5}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients about your design capabilities, history, and standards..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--bc-radius-sm)',
                    border: '1px solid var(--bc-border)',
                    outline: 'none',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--bc-bg-secondary)',
                    color: 'var(--bc-text-primary)',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--bc-border-active)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--bc-border)'}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button type="submit" variant="primary" loading={saving}>
                <Save size={16} /> Save Changes
              </Button>
            </div>
          </Card>
        </form>

        {/* Portfolio Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.4rem' }}>Showcase Portfolio</h2>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Add Project
            </Button>
          </div>

          {portfolio.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--bc-border)' }}>
              <ImageIcon size={36} color="var(--bc-text-muted)" style={{ marginBottom: '12px' }} />
              <h3>Your Portfolio is empty</h3>
              <p style={{ color: 'var(--bc-text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Upload photos of your previous builds to showcase your skills to prospective clients.
              </p>
              <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
                Upload First Project
              </Button>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {portfolio.map((item) => (
                <Card key={item.id} hoverLift style={{ padding: '0', overflow: 'hidden' }}>
                  <img 
                    src={item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`} 
                    alt={item.title} 
                    style={{ width: '100%', height: '160px', objectFit: 'cover' }} 
                  />
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--bc-text-muted)', marginBottom: '8px' }}>{item.project_date}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--bc-text-secondary)', height: '40px', overflow: 'hidden' }}>
                      {item.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Add Portfolio Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPortError(''); setUploadedUrl(''); }}
        title="Add Portfolio Showcase"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); setPortError(''); setUploadedUrl(''); }}>Cancel</Button>
            <Button variant="primary" onClick={handleAddPortfolioItem} disabled={!uploadedUrl}>
              Add Item
            </Button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {portError && (
            <div style={{ color: 'var(--bc-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: 'var(--bc-radius-sm)', fontSize: '0.85rem' }}>
              {portError}
            </div>
          )}

          {/* File selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Project Photo</label>
            {uploadedUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: 'var(--bc-radius-md)', overflow: 'hidden' }}>
                <img 
                  src={uploadedUrl.startsWith('http') ? uploadedUrl : `${API_BASE_URL}${uploadedUrl}`} 
                  alt="preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <button
                  type="button"
                  onClick={() => setUploadedUrl('')}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(30,42,56,0.8)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{
                border: '2px dashed var(--bc-border)',
                borderRadius: 'var(--bc-radius-md)',
                padding: '30px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bc-bg-primary)',
                position: 'relative'
              }}>
                <Upload size={24} color="var(--bc-text-muted)" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--bc-text-secondary)' }}>
                  {uploadingImage ? "Uploading image..." : "Select project picture"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Project Title</label>
            <input 
              type="text" 
              required 
              value={portTitle} 
              onChange={(e) => setPortTitle(e.target.value)} 
              placeholder="e.g. Modern Residential Villa" 
              style={{ ...inputStyle, paddingLeft: '12px' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Project Description</label>
            <input 
              type="text" 
              required 
              value={portDesc} 
              onChange={(e) => setPortDesc(e.target.value)} 
              placeholder="e.g. Handover of complete brickwork and structural columns." 
              style={{ ...inputStyle, paddingLeft: '12px' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Completion Date</label>
            <input 
              type="date" 
              required 
              value={portDate} 
              onChange={(e) => setPortDate(e.target.value)} 
              style={{ ...inputStyle, paddingLeft: '12px' }} 
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Styles
const inputStyle = {
  width: '100%',
  padding: '12px 12px 12px 40px',
  borderRadius: 'var(--bc-radius-sm)',
  border: '1px solid var(--bc-border)',
  outline: 'none',
  fontSize: '0.95rem',
  backgroundColor: 'var(--bc-bg-secondary)',
  color: 'var(--bc-text-primary)'
};

const inputStyleRaw = {
  width: '100%',
  padding: '12px',
  borderRadius: 'var(--bc-radius-sm)',
  border: '1px solid var(--bc-border)',
  outline: 'none',
  fontSize: '0.95rem',
  backgroundColor: 'var(--bc-bg-secondary)',
  color: 'var(--bc-text-primary)'
};

export default BuilderProfileEdit;

