import { supabase } from "./authentication/supabaseClient";
import { getUserId } from "./utils/storage";

export async function deductTokens(tokensUsed, user_id) {
    console.log(`Deducting tokens from the user's available tokens...`);

    // Fetch the user's current tokens
    const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('available_tokens')
        .eq('user_id', user_id)
        .single();

    const available_tokens = userData?.available_tokens || 0;

    if (fetchError) {
        console.log(`Unable to fetch the user's available tokens`, fetchError.message);
    } else {
        console.log(`User's available tokens fetched successfully`);
    }
        

    // Update the user's available tokens
    const current_tokens = available_tokens - tokensUsed;
    const { error } = await supabase
        .from('users')
        .update({ available_tokens: current_tokens })
        .eq('user_id', user_id);

    if (error) {
        console.log('Unable to deduct tokens', error.message);
    } else {
        console.log('Tokens deducted successfully');
    }
}

export async function deductGuestTokens(tokensUsed, guest_id) {
    console.log(`Deducting tokens from guest's available tokens...`, tokensUsed);
    console.log()

    const { data: guestData, error: fetchError } = await supabase
        .from('guests')
        .select('available_tokens')
        .eq('guest_id', guest_id)
        .single();

    const available_tokens = guestData?.available_tokens;

    if (fetchError) {
        console.log(`Unable to fetch guest's available tokens`, fetchError.message);
        return;
    }

    // Find the sum of all the tokens in tokensUsed
    const total_tokens_used = tokensUsed.reduce((a, b) => a + b, 0);

    // Update the guest's available tokens
    const current_tokens = available_tokens - total_tokens_used;
    const { error } = await supabase
        .from('guests')
        .update({ available_tokens: current_tokens })
        .eq('guest_id', guest_id);

    if (error) {
        console.log('Unable to deduct guest tokens', error.message);
    } else {
        console.log('Guest tokens deducted successfully');
    }
}

export async function checkGuestTokens(guest_id) {
    console.log(`Checking guest's available tokens...`);

    const { data: guestData, error: fetchError } = await supabase
        .from('guests')
        .select('available_tokens')
        .eq('guest_id', guest_id)
        .single();

    const available_tokens = guestData?.available_tokens;

    if (fetchError) {
        console.log(`Unable to fetch guest's available tokens`, fetchError.message);
        return;
    }

    if (available_tokens <= 0) {
        console.log(`Guest's available tokens are less than or equal to 0`);
        return false;
    }
    else {
        console.log(`Guest's available tokens checked successfully`);
        return true;
    }
}

export async function checkUserTokens(user_id) {
    console.log(`Checking user's available tokens...`);

    const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('available_tokens')
        .eq('user_id', user_id)
        .single();

    const available_tokens = userData?.available_tokens;

    if (fetchError) {
        console.log(`Unable to fetch user's available tokens`, fetchError.message);
        return;
    }

    if (available_tokens <= 0) {
        console.log(`User's available tokens are less than or equal to 0`);
        return false;
    }
    else {
        console.log(`User's available tokens checked successfully`);
        return true;
    }
}