import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate, Link } from 'react-router-dom';
import { saveUserId } from '../utils/storage';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Handle the Login process
    const handleLogin = async(e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
                method: 'POST',
                headers: API_CONFIG.DEFAULT_HEADERS,
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ 
                    email: email.trim(), 
                    password 
                }),
            });          

            const data = await response.json();

            // Check if login is successful
            if (response.ok) {
                localStorage.setItem("token", data.token);
                
                // Store user ID in localStorage
                const user_id = data.user.id;
                saveUserId(user_id);

                // Navigate to Chats.js
                navigate("/Chat");
                
            } else {
            alert(data.message);
            }

        } catch (error) {
            console.error("Login failed:", error);
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Welcome Back</h1>
                <p className="login-subtitle">
                    Sign in to access your account and continue your conversations
                </p>
                <form onSubmit={handleLogin} className="login-form">

                    { /* Email section */ }
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

                    { /* Password section */ }
                    <div className="form-group">
                        <div className="password-header">
                            <label htmlFor="password" className="input-label">Password</label>
                            <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
                        </div>
                        <input 
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button">
                        Continue
                    </button>

                    <div className="divider">
                        <span className="divider-line"></span>
                        <span className="divider-text">OR</span>
                        <span className="divider-line"></span>
                    </div>

                    <div className="signup-redirect">
                        Don't have an account?{' '}
                        <Link to="/auth/SignupPage" className="signup-link">Sign up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
