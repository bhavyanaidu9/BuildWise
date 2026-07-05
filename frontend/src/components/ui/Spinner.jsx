import React from 'react';
import './Spinner.css';

const Spinner = ({
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bc-spinner-container ${className}`}
      {...props}
    >
      <div className={`bc-spinner bc-spinner-${size}`}></div>
    </div>
  );
};

export default Spinner;
