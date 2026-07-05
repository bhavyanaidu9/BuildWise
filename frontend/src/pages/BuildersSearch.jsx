import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuilderCard, EmptyState, Spinner, Button, Card } from '../components/ui';
import { Search, SlidersHorizontal, Star, RefreshCw } from 'lucide-react';

const BuildersSearch = () => {
  const navigate = useNavigate();

  // Filter states
  const [location, setLocation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [minRating, setMinRating] = useState('');
  const [page, setPage] = useState(1);

  // API Data states
  const [builders, setBuilders] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch builders matching current filters
  const fetchBuilders = async () => {
    setLoading(true);
    setError('');
    
    // Construct query parameters
    const params = new URLSearchParams();
    if (location.trim()) params.append('location', location.trim());
    if (specialization) params.append('specialization', specialization);
    if (minBudget) params.append('min_budget', minBudget);
    if (maxBudget) params.append('max_budget', maxBudget);
    if (minRating) params.append('min_rating', minRating);
    params.append('page', page);
    params.append('limit', 6); // 6 per page is perfect for a 3-column layout

    try {
      const res = await fetch(`${API_BASE_URL}/api/builders/search?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve builder directory');
      }
      const data = await res.json();
      setBuilders(data.builders || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on filter changes or page change
  useEffect(() => {
    fetchBuilders();
  }, [specialization, minRating, page]);

  // Handle manual form submissions for text inputs (location, budgets)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // reset to page 1 on new searches
    fetchBuilders();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setLocation('');
    setSpecialization('');
    setMinBudget('');
    setMaxBudget('');
    setMinRating('');
    setPage(1);
    // Let the state effect trigger fetch
    setTimeout(fetchBuilders, 50);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--bc-primary-dark)', marginBottom: '8px' }}>
          Find Construction Partners
        </h1>
        <p style={{ color: 'var(--bc-text-secondary)', fontSize: '1rem' }}>
          Browse verified local building agencies, contractors, and decorators in Hyderabad.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Left Sidebar Filters */}
        <aside style={{ position: 'sticky', top: '90px' }}>
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--bc-border)', paddingBottom: '12px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <SlidersHorizontal size={18} color="var(--bc-primary-light)" />
                Filter Search
              </h3>
              <button 
                type="button" 
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--bc-primary-light)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Location Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>
                  Service Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Hyderabad"
                  style={inputStyle}
                />
              </div>

              {/* Specialization Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>
                  Specialization
                </label>
                <select
                  value={specialization}
                  onChange={(e) => { setSpecialization(e.target.value); setPage(1); }}
                  style={selectStyle}
                >
                  <option value="">All Specializations</option>
                  <option value="residential">Residential Builders</option>
                  <option value="commercial">Commercial Builders</option>
                  <option value="renovation">Renovations & Interiors</option>
                </select>
              </div>

              {/* Budget capability */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>
                  Budget Capability (₹)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="Min"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <span style={{ color: 'var(--bc-text-muted)', fontSize: '0.8rem' }}>to</span>
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="Max"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              </div>

              {/* Min rating */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bc-text-primary)' }}>
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
                  style={selectStyle}
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">★ 4.5 & Above</option>
                  <option value="4.0">★ 4.0 & Above</option>
                  <option value="3.0">★ 3.0 & Above</option>
                </select>
              </div>

              <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '10px' }}>
                <Search size={16} /> Search
              </Button>
            </form>
          </Card>
        </aside>

        {/* Right Panel Builder Grid */}
        <main>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div style={{ color: 'var(--bc-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: 'var(--bc-radius-md)', textAlign: 'center' }}>
              {error}
            </div>
          ) : builders.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No Builders Match Your Query"
              description="Try adjusting your service area name, widening budget parameters, or modifying specialization types."
              actionLabel="Reset Search Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              
              {/* Directory stats bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--bc-text-secondary)' }}>
                  Found <strong>{total}</strong> verified building experts
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--bc-text-muted)' }}>
                  Page {page} of {totalPages}
                </span>
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {builders.map((builder) => (
                  <BuilderCard
                    key={builder.user_id}
                    builder={builder}
                    onClick={() => navigate(`/builders/${builder.user_id}`)}
                  />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: '1px solid var(--bc-border)',
                  paddingTop: '20px',
                  marginTop: '10px'
                }}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1} 
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--bc-radius-sm)',
                        border: '1px solid',
                        borderColor: page === pNum ? 'var(--bc-primary)' : 'var(--bc-border)',
                        backgroundColor: page === pNum ? 'var(--bc-primary)' : 'transparent',
                        color: page === pNum ? '#FFF' : 'var(--bc-text-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {pNum}
                    </button>
                  ))}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === totalPages} 
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

// Input style helper matching standard resets
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--bc-radius-sm)',
  border: '1px solid var(--bc-border)',
  outline: 'none',
  fontSize: '0.9rem',
  backgroundColor: 'var(--bc-bg-secondary)',
  color: 'var(--bc-text-primary)'
};

const selectStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--bc-radius-sm)',
  border: '1px solid var(--bc-border)',
  outline: 'none',
  fontSize: '0.9rem',
  backgroundColor: 'var(--bc-bg-secondary)',
  color: 'var(--bc-text-primary)',
  cursor: 'pointer'
};

export default BuildersSearch;

