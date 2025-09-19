import './ConfirmEmail.css';
import React, { useState } from 'react';

export default function ConfirmEmail() {
    const [code, setCode] = useState()
    const [code_input, setCodeInput] = useState();

    const generateCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000);
        setCode(code)
    }

    const compareCodes = () => {
        if (code === code_input) {
            console.log('Verification has been successful')
        } else {
            console.log('Incorrect code - Verification has been failed')
        }
    }

    return(
        <div className="confirm-email-container">
            <p1 className="logo">Promptly</p1>

            <p1 className="confirm-email-title">Confirm Email</p1>
            <p1 className="confirm-email-subtitle">An confirmation code has been sent your email, please type in the code to continue.</p1>

            <textarea className="code-input"
                placeholder="Enter code"
                maxLength={6}
                value={code_input}
                onChange={(e) => setCodeInput(e.target.value)}
            >
            </textarea>
            
            <button className="continue-button" onClick={compareCodes}>Confirm</button>

        </div>
    )
}