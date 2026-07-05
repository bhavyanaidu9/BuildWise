import React from 'react';
import './CurrencyDisplay.css';

const CurrencyDisplay = ({
  amount,
  amountMin,
  amountMax,
  className = '',
  ...props
}) => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  const formatValue = (val) => {
    if (val === undefined || val === null) return '';
    return formatter.format(val);
  };

  const renderContent = () => {
    if (amountMin !== undefined && amountMin !== null && amountMax !== undefined && amountMax !== null) {
      return `${formatValue(amountMin)} - ${formatValue(amountMax)}`;
    }
    if (amount !== undefined && amount !== null) {
      return formatValue(amount);
    }
    if (amountMin !== undefined && amountMin !== null) {
      return `Min: ${formatValue(amountMin)}`;
    }
    if (amountMax !== undefined && amountMax !== null) {
      return `Max: ${formatValue(amountMax)}`;
    }
    return '';
  };

  return (
    <span className={`bc-currency ${className}`} {...props}>
      {renderContent()}
    </span>
  );
};

export default CurrencyDisplay;
