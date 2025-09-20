import { supabase } from "../config/db.js";


export async function Login(email, password) {
    console.log('Attempting to login with email:', email);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        console.log('Supabase auth response:', { data, error });

        if (error) {
            console.error('Supabase auth error:', error);
            throw error;
        }
        
        if (!data || !data.user) {
            console.error('No user data returned from Supabase');
            return null;
        }
        
        console.log('Login successful for user:', data.user.id);
        return data;
        
    } catch (error) {
        console.error('Error in Login service:', {
            message: error.message,
            code: error.code,
            status: error.status,
            stack: error.stack
        });
        return null;
    }
}


export async function Signup(email, password, repeatPassword) {
    console.log('Starting signup process for:', email);
    
    try {
        console.log('Calling Supabase auth.signUp...');
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: 'http://localhost:3000/auth/confirm',
                data: {
                    full_name: '', // This can be updated later
                }
            }
        });

        console.log('Supabase auth.signUp response:', { data, error });

        if (error) {
            console.error('Supabase auth error details:', {
                message: error.message,
                status: error.status,
                code: error.code,
                stack: error.stack
            });
            throw error;
        }
        
        if (!data || !data.user) {
            console.error('No user data returned from Supabase');
            return null;
        }
        
        console.log('Sign up successful for user:', data.user.id);

        const user_id = data.user.id;
        console.log(`Adding user to the 'users' table:`, user_id);

        const { data: userData, error: insertError } = await supabase
        .from('users')
        .insert({
            user_id,
            email
        })

        if (insertError) {
            console.error('Error inserting user into database:', insertError);
            throw insertError;
        }
            
        console.log('User added to database successfully:', userData);
        // Return Signup data
        return data;
        
    } catch (error) {
        const errorDetails = {
            message: error.message,
            code: error.code,
            status: error.status,
            name: error.name,
            stack: error.stack,
            response: error.response?.data,
            request: error.request,
            config: error.config
        };
        console.error('Sign up failed with error:', JSON.stringify(errorDetails, null, 2));
        
        // Create a new error with enhanced details
        const enhancedError = new Error(error.message || 'Signup failed');
        Object.assign(enhancedError, errorDetails);
        throw enhancedError;
    }
}



export async function getSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        
        if (!session) {
            console.log('No active session found');
            return null;
        }
        
        // Return the user ID from the session
        return session.user.id;
        
    } catch (error) {
        console.error('Error in getSession service:', error);
        return null;
    }
}

export async function AddUserInfo(user_id, full_name, purpose) {
    if (!user_id) {
        throw new Error('User ID is required');
    }

    if (!full_name || full_name.trim().length < 2) {
        throw new Error('Full name must be at least 2 characters long');
    }

    if (!purpose) {
        throw new Error('Purpose is required');
    }

    console.log('Updating user info for user:', user_id);

    try {

        // First, update the user info
        const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({
                'name': full_name,
                'purpose': purpose,
                'available_tokens': 5000,
                'allocated_tokens': 5000,
                'subscription': 'Free Trial'
            })
            .eq('user_id', user_id)
            .select()
            .single();

        if (updateError) {
            console.error('Database error when updating user info:', { error: updateError });
            throw new Error(`Failed to update user info: ${updateError.message}`);
        }

        if (!updateData) {
            throw new Error('No data returned after update');
        }

        console.log('Successfully updated user info for:', user_id);

        // Return the updated user data in the expected format
        return {
            full_name: updateData.name || full_name,
            purpose: updateData.purpose || purpose,
            updated_at: updateData.updated_at || new Date().toISOString()
        };

    } catch (error) {
        console.error('Error in AddUserInfo:', {
            error: error.message,
            userId: user_id,
            stack: error.stack
        });
        throw error;
    }
}