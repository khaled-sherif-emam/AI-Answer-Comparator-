import { createClient } from '@supabase/supabase-js'
import { removeUserId, removeChatId, saveUserId } from '../utils/storage';
import {storeUserId} from '../utils/storage';

const supabase = createClient(
    "https://lzdmhggnghjmmeuydfdr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZG1oZ2duZ2hqbW1ldXlkZmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NDM5OTAsImV4cCI6MjA3MjIxOTk5MH0.TGS2j9-xNJf0of5_5P8e-r-b1E-8_HPBRdmgiw49Upo"
)

export async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
  
    if (error) {
      console.error("Error getting session:", error.message);
      return null;
    }
  
    if (data.session) {
      console.log("Session:", data.session);
      console.log("User ID:", data.session.user.id);
      return data.session.user.id;
    } else {
      console.log("No active session");
      return null;
    }
}

export async function SignUp(email, password) {
    console.log('Accessed Signup')
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })
    
    if (error) {
        console.error("Signup error:", error.message)
        return null
    } else {
        console.log("User signed up:", data.user)
        return data.user
    }

    // TASK: Improve flow later
}

export async function addUserInfo(fullName, purpose) {
    console.log('Adding user info...')

    // Get the user id from session
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
        console.error("No active session found");
        return null;
    }
    
    const userId = session.data.session.user.id;
    console.log("User ID:", userId);
    
    const { data: userInfo, error } = await supabase
        .from('users')
        .insert([{
            user_id: userId,
            name: fullName,
            purpose: purpose
        }])
        .select();
    
    if (error) {
        console.error("Error adding user info:", error.message);
        return null;
    } else {
        console.log("User info added:", userInfo);
        return userInfo;
    }
}

export async function Login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        console.log("Login error:", error.message)
        return null
    } else {
        console.log("User logged in!")
        const userId = data.session.user.id;
        saveUserId(userId);  // Store the user's id in the local storage for future use.
    }
    
    // TASK: Improve flow later
}

export async function getUserName(userId, order) {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('user_id', userId);
  
    if (error) {
      console.log(`Error fetching the user's name`, error.message);
      return null;
    } else if (data && data.length > 0) {
      const fullName = data[0].name;
  
      if (order === 'Full name') {
        return fullName;
      } else if (order === 'Initials') {
        return fullName
          .split(' ')
          .map(word => word[0].toUpperCase())
          .join('');
      }
    }
  
    return null; // fallback if no data
  }

export async function Logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error.message);
  } else {
    // Clear chat id from storage
    removeChatId();
    removeUserId();
    console.log("User signed out successfully");

  } 
}