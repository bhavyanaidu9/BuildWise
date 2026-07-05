import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
  ...props
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.className === 'bc-modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="bc-modal-overlay" onClick={handleOverlayClick} {...props}>
      <div className={`bc-modal-content ${className}`}>
        <div className="bc-modal-header">
          <h2 className="bc-modal-title">{title}</h2>
          <button className="bc-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        
        <div className="bc-modal-body">
          {children}
        </div>

        {footer && (
          <div className="bc-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
