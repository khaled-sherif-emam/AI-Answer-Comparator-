import { useState } from 'react';
import { getUserId } from '../utils/storage';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';
import './UserInfoInput.css';
import { useNavigate } from 'react-router-dom';

export function UserInfoInput() {
    const [fullName, setFullName] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const purposeOptions = [
        'Personal use',
        'Work/Professional',
        'Education/Research',
        'Content Creation',
        'Software Development',
        'Other'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        // Basic validation
        if (!fullName || fullName.trim().length < 2) {
            setError('Please enter a valid full name (at least 2 characters)');
            setLoading(false);
            return;
        }
        if (!purpose) {
            setError('Please select a purpose');
            setLoading(false);
            return;
        }
        
        try {
            // Get user ID from local storage
            const user_id = getUserId();

            const response = await fetch(API_ENDPOINTS.AUTH.USER_INFO, {
                method: 'POST',
                headers: {
                    ...API_CONFIG.DEFAULT_HEADERS,
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    user_id,
                    full_name: fullName.trim(),
                    purpose
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save user information');
            }
            
            // Redirect to chat after successful submission
            window.location.href = '/chat/Chat';
            
        } catch (error) {
            console.error('Error saving user info:', error.message);
            setError(error.message || 'An error occurred while saving your information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-info-container">
            <div className="user-info-card">
                <h2 className="welcome-label">Let's get started!</h2>
                <p className="user-info-subtitle">Tell us a bit more about yourself so we can personalize your experience</p>
                
                <form onSubmit={handleSubmit} className="user-info-form">
                    <div className="form-group">
                        <label htmlFor="fullName" className="input-label">Full Name</label>
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="input-field"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="purpose" className="input-label">What do you want to use this for?</label>
                        <select
                            id="purpose"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="purpose-select"
                            required
                            disabled={loading}
                        >
                            <option value="">Select a purpose</option>
                            {purposeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button 
                        type="submit" 
                        className="continue-button" 
                        disabled={loading || !fullName.trim() || !purpose}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Saving...
                            </>
                        ) : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
