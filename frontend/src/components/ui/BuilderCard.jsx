import React from 'react';
import Card from './Card';
import StatusBadge from './StatusBadge';
import CurrencyDisplay from './CurrencyDisplay';
import Button from './Button';
import { MapPin, Briefcase, Star, Award } from 'lucide-react';
import './BuilderCard.css';

const BuilderCard = ({
  builder,
  onClick,
  className = '',
  ...props
}) => {
  const {
    business_name,
    specialization,
    years_experience,
    service_areas,
    budget_min,
    budget_max,
    bio,
    is_verified,
    avg_rating
  } = builder;

  const handleCardClick = (e) => {
    if (e.target.closest('button')) {
      return;
    }
    if (onClick) {
      onClick(builder);
    }
  };

  return (
    <Card
      hoverLift
      onClick={onClick ? handleCardClick : undefined}
      className={`bc-builder-card ${className}`}
      {...props}
    >
      <div className="bc-builder-card-header">
        <span className="bc-builder-card-tag">
          <Briefcase size={12} />
          {specialization}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Star size={14} fill="var(--bc-accent)" color="var(--bc-accent)" />
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{avg_rating || 'N/A'}</span>
        </div>
      </div>

      <h3 className="bc-builder-card-title">
        {business_name}
        {is_verified && <StatusBadge status="verified" style={{ transform: 'scale(0.85)', transformOrigin: 'left' }} />}
      </h3>
      
      <p className="bc-builder-card-desc">{bio}</p>

      <div className="bc-builder-card-meta">
        <span className="bc-builder-card-meta-item">
          <Award size={14} />
          {years_experience} Yrs Exp
        </span>
        <span className="bc-builder-card-meta-item" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <MapPin size={14} />
          {service_areas && service_areas.length > 0 ? service_areas.slice(0, 2).join(', ') : 'Hyderabad'}
        </span>
      </div>

      <div className="bc-builder-card-footer">
        <div className="bc-builder-card-budget">
          <span className="bc-builder-card-budget-label">Budget Capability</span>
          <CurrencyDisplay
            amountMin={budget_min}
            amountMax={budget_max}
            className="bc-builder-card-budget-value"
          />
        </div>

        <Button variant="outline" size="sm">
          View Profile
        </Button>
      </div>
    </Card>
  );
};

export default BuilderCard;
