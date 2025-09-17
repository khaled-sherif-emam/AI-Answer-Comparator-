import React, { useState } from "react";
import './LoginPage.css'
import { Login } from "./auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [masked, setMasked] = useState("");

    const handleLogin = async() => {
        console.log("email:", email)
        console.log("password:", password)

        await Login(email, password)
        navigate('/Chat');
    }
    

    return (
        <div className="login-container">

            { /* Login title and subtitle */ }
            <p1 className="login-title">Log in</p1>
            <p1 className="login-subtitle">You'll get smarter responses, more credits and more model comparisons when you sign up for free! </p1>

            { /* Email and password text inputs */ }
            <input type="email" className="email-input" placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}>
            </input>
            <input type="password"className="password-input" placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}>
            </input>

            <button className="continue-button" onClick={handleLogin}>
                Continue
            </button>

            { /* OR line */ }
            <div className="or-container">
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

            <p1 className="login-subtitle">Don't have an account? <a href="/auth/SignupPage">Sign up</a></p1>

        </div>
    )
}
