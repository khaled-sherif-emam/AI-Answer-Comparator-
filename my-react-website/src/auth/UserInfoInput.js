import { useState } from 'react';
import { supabase } from './supabaseClient';
import { getUserId } from '../utils/storage';
import './UserInfoInput.css';
import { addUserInfo } from './auth';

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
        
        try {
            // Add user's info to the database
            const result = await addUserInfo(fullName, purpose);
            if (result) {
                // Redirect to chat after successful submission
                window.location.href = '/chat';
            } else {
                setError('Failed to save user information. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-info-container">
            <div className="user-info-card">
                <h2 className="welcome-label">Welcome!</h2>
                <p className="user-info-subtitle">Tell us a bit more about yourself so we can personalize your experience</p>
                
                <form onSubmit={handleSubmit} className="user-info-form">
                    <p className="name-input-label">What's your name?</p>
                    <div className="name-input">
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="purpose-input">
                        <label htmlFor="purpose">What do you want to use Promptly for?</label>
                        <select
                            id="purpose"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="purpose-select"
                            required
                            disabled={loading}
                        >
                            <option value="">Select an option</option>
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
                        className="submit-button"
                        disabled={loading || !fullName.trim() || !purpose}
                    >
                        {loading ? 'Saving...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
