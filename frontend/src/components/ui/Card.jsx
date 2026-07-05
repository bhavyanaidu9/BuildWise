import React from 'react';
import './Card.css';

const Card = ({
  children,
  hoverLift = false,
  onClick,
  className = '',
  ...props
}) => {
  const isClickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={`bc-card ${hoverLift ? 'bc-card-hover' : ''} ${isClickable ? 'bc-card-clickable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
