import React from 'react';
import './Button.css';

const Button = ({
  variant = 'primary', // 'primary' | 'outline' | 'danger'
  size = 'md',        // 'sm' | 'md'
  type = 'button',
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`bc-btn bc-btn-${variant} bc-btn-${size} ${loading ? 'bc-btn-loading' : ''} ${className}`}
      {...props}
    >
      {loading && <span className="bc-btn-spinner"></span>}
      {children}
    </button>
  );
};

export default Button;
