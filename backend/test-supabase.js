import { supabase } from './src/config/db.js';

async function testSupabase() {
  console.log('Testing Supabase connection...');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  
  try {
    // Test a simple query to check the connection
    const { data, error } = await supabase
      .from('users')  // Replace with an actual table name in your Supabase
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return;
    }

    console.log('Supabase connection successful!');
    console.log('Test query result:', data);
  } catch (error) {
    console.error('Error testing Supabase:', error);
  }
}

testSupabase();
