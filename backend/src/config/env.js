// env.js loads environment variables from .env file

import dotenv from 'dotenv';
dotenv.config();

const env = {
    port: process.env.PORT || 5000,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
  };
  
export default env;

