import React from 'react';
import Button from './Button';
import './EmptyState.css';

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  ...props
}) => {
  return (
    <div className={`bc-empty-state ${className}`} {...props}>
      {icon && (
        <div className="bc-empty-state-icon">
          {typeof icon === 'string' ? (
            <span role="img" aria-label="empty-state-icon" style={{ fontSize: '2.5rem' }}>{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      <h3 className="bc-empty-state-title">{title}</h3>
      <p className="bc-empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction} className="bc-empty-state-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
