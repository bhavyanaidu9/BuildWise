import React from 'react';
import Card from './Card';
import StatusBadge from './StatusBadge';
import CurrencyDisplay from './CurrencyDisplay';
import Button from './Button';
import { MapPin, Calendar, Layers } from 'lucide-react';
import './ProjectCard.css';

const ProjectCard = ({
  project,
  role, // 'customer' | 'builder'
  onClick,
  footerAction, // { label, onClick, variant }
  className = '',
  ...props
}) => {
  const {
    title,
    description,
    project_type,
    location,
    budget_min,
    budget_max,
    desired_timeline,
    status
  } = project;

  const handleCardClick = (e) => {
    // If clicking a button, do not bubble up to card click
    if (e.target.closest('button')) {
      return;
    }
    if (onClick) {
      onClick(project);
    }
  };

  return (
    <Card
      hoverLift
      onClick={onClick ? handleCardClick : undefined}
      className={`bc-project-card ${className}`}
      {...props}
    >
      <div className="bc-project-card-header">
        <span className="bc-project-card-tag">
          <Layers size={12} />
          {project_type}
        </span>
        <StatusBadge status={status} />
      </div>

      <h3 className="bc-project-card-title">{title}</h3>
      
      <p className="bc-project-card-desc">{description}</p>

      <div className="bc-project-card-meta">
        <span className="bc-project-card-meta-item">
          <MapPin size={14} />
          {location}
        </span>
        <span className="bc-project-card-meta-item">
          <Calendar size={14} />
          {desired_timeline}
        </span>
      </div>

      <div className="bc-project-card-footer">
        <div className="bc-project-card-budget">
          <span className="bc-project-card-budget-label">Est. Budget</span>
          <CurrencyDisplay
            amountMin={budget_min}
            amountMax={budget_max}
            className="bc-project-card-budget-value"
          />
        </div>

        {footerAction && (
          <Button
            variant={footerAction.variant || 'primary'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              footerAction.onClick(project);
            }}
          >
            {footerAction.label}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProjectCard;
