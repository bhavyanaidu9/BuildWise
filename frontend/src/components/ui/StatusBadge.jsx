import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({
  status,
  colorMap = {},
  className = '',
  ...props
}) => {
  const getBadgeClass = () => {
    const normStatus = (status || '').toLowerCase().trim();
    
    // Check user-passed custom color map first
    if (colorMap && colorMap[normStatus]) {
      return `bc-badge-${colorMap[normStatus]}`;
    }
    
    // Default mappings across the app
    const defaults = {
      // project status
      open: 'warning',
      quoted: 'info',
      hired: 'primary',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'danger',
      // quote status
      pending: 'warning',
      accepted: 'success',
      rejected: 'danger',
      // quote source
      invited: 'primary',
      marketplace: 'secondary',
      // project milestone status
      done: 'success',
      // verification
      verified: 'success',
      unverified: 'danger',
      true: 'success',
      false: 'danger'
    };
    
    const type = defaults[normStatus] || 'secondary';
    return `bc-badge-${type}`;
  };

  return (
    <span className={`bc-badge ${getBadgeClass()} ${className}`} {...props}>
      {status}
    </span>
  );
};

export default StatusBadge;
