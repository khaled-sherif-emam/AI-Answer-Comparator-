import { supabase } from "../authentication/supabaseClient"


// Format token numbers with 'M' for millions
export function formatTokens(num) {
    if (!num && num !== 0) return '0';
    return num >= 1000000 
      ? (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
      : num.toLocaleString();
}