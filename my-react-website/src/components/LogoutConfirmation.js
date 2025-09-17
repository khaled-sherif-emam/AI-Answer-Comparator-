import React from 'react';
import './LogoutConfirmation.css';

const LogoutConfirmation = ({ onConfirm, onCancel }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>Are you sure you want to logout?</h3>
        <p className="logout-popup-subtext">You can log back in anytime.</p>
        <div className="popup-buttons">
          <button className="popup-button cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="popup-button confirm" onClick={onConfirm}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmation;
