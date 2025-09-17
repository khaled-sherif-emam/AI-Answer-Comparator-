import { supabase } from '../config/supabase.js';

export async function storePrompt(chat_id, content) {
    const nowLocal = new Date().toISOString();
    const localTime = new Date().toLocaleString("sv-SE", { timeZoneName: "short" }).replace(" ", "T");

    const { data: promptData, error: insertError } = await supabase
        .from("prompts")
        .insert([{ 
            chat_id: chat_id, 
            content: content, 
            created_at: localTime 
        }]);

    if (insertError) {
        console.error("Error inserting prompt:", insertError);
        throw insertError;
    }

    console.log("Prompt inserted successfully:", promptData);
    return promptData;
}
