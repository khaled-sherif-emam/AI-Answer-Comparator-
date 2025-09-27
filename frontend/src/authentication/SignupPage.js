import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate, Link } from 'react-router-dom';
import { saveUserId } from "../utils/storage";
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

export default function SignupPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleBackToChat = () => {
        navigate('/'); // Navigate back to the chat page
    };

    // Handle the signup process
    const handleSignup = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        setIsLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
                method: 'POST',
                headers: API_CONFIG.DEFAULT_HEADERS,
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ 
                    email: email.trim(), 
                    password, 
                    repeatPassword 
                }),
            });          

            const data = await response.json();

            // Check if signup is successful
            if (response.ok) {
                // Store the token in localStorage
                localStorage.setItem("token", data.token);
                
                // Store user ID in localStorage
                const user_id = data.user.id;
                saveUserId(user_id);

                // Navigate to the desired page after successful signup
                navigate("/authentication/UserInfoInput");
            } else {
                // Handle API errors
                const errorMessage = data.message || 'Signup failed. Please try again.';
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Signup failed:", error);
            setError(error.message || 'An error occurred during signup');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="login-container">
            <button 
                onClick={handleBackToChat}
                className="back-to-chat-button"
                aria-label="Back to Chat"
            >
                ← Back to Chat
            </button>
            <div className="login-card">
                <h1 className="login-title">Create an Account</h1>
                <p className="login-subtitle">
                    Sign up to get started with your account
                </p>
                
                {error && (
                    <div className="error-message" style={{ 
                        color: '#e74c3c', 
                        marginBottom: '20px',
                        textAlign: 'center',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email" className="input-label">Email Address</label>
                        <input 
                            id="email"
                            type="email" 
                            className="input-field"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="input-label">Password</label>
                        <input 
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                        <input 
                            id="confirmPassword"
                            type="password"
                            className="input-field"
                            placeholder="Confirm your password"
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button">
                        Create Account
                    </button>

                    <div className="divider">
                        <span className="divider-line"></span>
                        <span className="divider-text">OR</span>
                        <span className="divider-line"></span>
                    </div>


                    <div className="signup-redirect">
                        Already have an account?{' '}
                        <Link to="/authentication/LoginPage" className="signup-link">Log in</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}