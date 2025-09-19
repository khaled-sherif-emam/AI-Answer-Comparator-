import { supabase } from "./src/auth/supabaseClient";

export async function getUserName(userId) {
    console.log('Fetching user initials for user', userId);

    const {data, error} = await supabase
    .from('users')
    .select('name')
    .eq('user_id', userId)
    .single()

    if (error) {
        console.log("Error fetching user name", error.message);
        return null;
    } else {
        console.log('User name:', data.name);
        return data.name;
    }
}