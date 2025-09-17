import './SignupPage.css'
import React, { useState } from 'react'
import { SignUp } from './auth'
import { useNavigate } from 'react-router-dom'

export default function SignupPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')

    const handleSignup = async () => {
        console.log("email:", email)
        console.log("password:", password)
        console.log("Repeated password:", repeatPassword)

        if (password !== repeatPassword) {
            console.log('ERROR - Passwords do not match')
            return false;
        }
        
        try {
            const { user, error } = await SignUp(email, password);
            if (error) {
                console.error('Signup error:', error.message);
                return false;
            }
            console.log('Signup successful, user:', user);
            return true;
        } catch (error) {
            console.error('Signup failed:', error);
            return false;
        }
    }

    return (
        <div className="signup-container">

            { /* Login title and subtitle */ }
            <p1 className="signup-title">Create an account</p1>
            <p1 className="signup-subtitle">You'll get smarter responses, more credits and more model comparisons when you sign up for free! </p1>

            { /* Email and password text inputs */}
            <input type="email" className="email-input" placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}>
            </input>
            <input type="password" className="password-input" placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}>
            </input>
            <input type="password" className="password-input" placeholder="Confirm password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}>
            </input>

            <button className="continue-button" onClick={async () => {
                const success = await handleSignup();
                if (success) {
                    navigate('/auth/UserInfoInput');
                }
            }}>
                Create account
            </button>

            { /* OR Section */ }
            <div className='or-container'>
                <div className="or-line"></div>  { /* Add the line */}
                <p1 className="or">OR</p1>
                <div className="or-line"></div>  { /* Add the line */}
            </div>

            { /* Login with other options */ }
            <div className="continue-with-container">
                <button className="continue-with-button">
                    <img className="google-logo" src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"></img>
                    Continue with Google
                </button>
                <button className="continue-with-button">
                    <img className="microsoft-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Microsoft_icon.svg/800px-Microsoft_icon.svg.png"></img>
                    Continue with Microsoft
                </button>
                <button className="continue-with-button">
                    <img className="apple-logo" src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"></img>
                    Continue with Apple
                </button>
            </div>

            <p1 className="login-subtitle">Already have an account? <a href="/auth/LoginPage">Log in</a></p1>
           
        </div>
    )
}