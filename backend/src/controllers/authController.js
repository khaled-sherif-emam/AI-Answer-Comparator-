import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { Login, Signup, AddUserInfo } from '../services/authServices.js';

// Initialize Supabase client with error handling
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Error: Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false
        }
    }
);

export async function loginUser(req, res) {
    console.log('Login request received:', { body: req.body });
    try {
        // Destructure email and password from request body
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Check if the user has entered an email and a password
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Sign in with Supabase
        console.log('Calling Login service...');
        const data = await Login(email, password);
        console.log('Login service response:', data);

        if (data === null) {
            console.error('Login failed: Invalid credentials');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: data.user.id, email: data.user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Return token and user data (without sensitive information)
        const userData = {
            id: data.user.id,
            email: data.user.email,
        };

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: userData
        });

    } catch (error) {
        console.error('Login failed:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function signupUser(req, res) {
    try {
        console.log('Signup request received:', { email: req.body.email });
        
        // Destructure email and password from request body
        const { email, password, repeatPassword } = req.body;

        // Check if the user has entered an email, password and repeat password
        if (!email || !password || !repeatPassword) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'Email, password and repeat password are required' });
        }

        // Check if the email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check password strength (at least 6 characters)
        if (password.length < 6) {
            console.log('Password too short');
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if the passwords match
        if (password !== repeatPassword) {
            console.log('Passwords do not match');
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        console.log('Attempting to sign up with Supabase...');
        console.log('Supabase URL from env:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
        console.log('Supabase ANON KEY from env:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
        
        // Sign the user up with Supabase
        const data = await Signup(email, password, repeatPassword);
        console.log('Supabase signup response:', JSON.stringify(data, null, 2));

        // If data is null, return error
        if (data === null) {
            return res.status(400).json({ message: 'Could not create user. The email might already be in use.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: data.user.id, email: data.user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Return user data and token
        return res.status(201).json({
            message: 'Signup successful',
            token,
            user: {
                id: data.user.id,
                email: data.user.email,
                email_confirmed: data.user.email_confirmed_at !== null
            }
        });

    } catch (error) {
        console.error('Signup failed with details:', JSON.stringify({
            message: error.message,
            code: error.code,
            status: error.status,
            name: error.name,
            stack: error.stack,
            response: error.response?.data,
            request: error.request,
            config: error.config
        }, null, 2));
        
        // Handle specific Supabase errors
        if (error.message && (error.message.includes('already registered') || error.code === '23505')) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        
        // Handle JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(500).json({ message: 'Error generating authentication token' });
        }
        
        return res.status(500).json({ 
            message: 'An error occurred during signup',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                code: error.code,
                status: error.status
            } : undefined
        });
    }
}

/**
 * Handle updating user information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleUserInfo(req, res) {
    const { user_id,full_name, purpose } = req.body;
    
   
    if (!user_id) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            error: 'No user ID found in request'
        });
    }

    try {
        // Update user info in the database
        const updatedUser = await AddUserInfo(user_id, full_name, purpose);
        
        if (!updatedUser) {
            throw new Error('Failed to update user information');
        }
        
        console.log('User info updated successfully:', updatedUser);
        
        // Return success response
        return res.status(200).json({
            success: true,
            message: 'User information updated successfully',
            data: {
                user_id: user_id,
                ...updatedUser
            }
        });
        
    } catch (error) {
        console.error('Error in handleUserInfo:', error);
        
        // Handle different types of errors
        if (error.message.includes('required') || error.message.includes('must be')) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.message
            });
        }
        
        // Default error response
        return res.status(500).json({
            success: false,
            message: 'Failed to update user information',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}