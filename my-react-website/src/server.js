import { supabase } from "./auth/supabaseClient"
import askChatGPT4 from "./api/ChatGPT4.1"
import askDeepSeekV3 from "./api/DeepSeekV3"
import askLlama3 from "./api/Llama3.3"

// TASK: update the calls for these functions!

// Improves the users prompt
export async function enhancePrompt(prompt) {
    console.log('Enhancing the prompt...')
    
    const enhancementCommand = `You are a prompt enhancement assistant. Your task is to enhance the user's prompt to make it more clear and concise. Your answer is what you'd type into the prompt box`
    const enhancedPromptAndTokensUsed = await askChatGPT4(enhancementCommand + "\n\n" + prompt, null)
    console.log('Enhanced prompt:', enhancedPromptAndTokensUsed)

    const enhancedPrompt = enhancedPromptAndTokensUsed[0];
    const tokensUsed = enhancedPromptAndTokensUsed[1];

    //deductTokens(tokensUsed) Remove the tokens used from the user's monthly available tokens

    return enhancedPrompt;
}

export async function storePrompt(prompt, chat_id) {
    console.log(prompt)

    const {data, error} = await supabase
    .from('prompts')
    .insert([{
        chat_id,
        content: prompt,
    }])
    .select()

    if (error) {
        console.log('ERROR - Unable to store prompt:', error.message)
        return null;
    } else {
        console.log('Prompt stored successfully')
        return data[0].id;
    }
}

export async function contactAI(selectedModels, prompt, chat_id) {
    console.log('Sending the prompt to the following models:', selectedModels);

    let responses = [];
    let tokensUsed = [];
    
    try {
        if (selectedModels.includes('ChatGPT-4.1')) {
            const responseAndTokens = await askChatGPT4(prompt, chat_id);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push(response);
            tokensUsed.push(tokens);
        }
        if (selectedModels.includes('DeepSeek-V3')) {
            const responseAndTokens = await askDeepSeekV3(prompt, chat_id);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push(response);
            tokensUsed.push(tokens);
        }
        if (selectedModels.includes('Llama 3.3 70B Instruct')) {
            const responseAndTokens = await askLlama3(prompt);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push(response);
            tokensUsed.push(tokens);
        }

        console.log('AI responses:', responses);
        return [responses, tokensUsed];
    } catch (error) {
        console.error('Error in contactAI:', error);
        throw error;
    }
}

// This is a temporary flow
export async function generateJointAnswer(prompt_id, responses, chat_id) {

    // Ask DeepSeek to create a joint answer based on what the other models answered
    const jointAnswer = await askDeepSeekV3(prompt+"\n\nAbove is the prompt and below is how the selected models answered it:\n\n"+responses+"Make me a joint response based on what each part of the response it answered well ")
    console.log("Joint answer", jointAnswer)

    // Store the joint answer in the database
    try {
        storeResponses(chat_id, prompt_id, ['Joint Response'], [jointAnswer])   
        console.log('Joint answer stored successfully!')     
    } catch {
        console.log('ERROR - Unable to store joint answer')
    }

    return jointAnswer;
}

export async function storeResponses(chat_id, prompt_id, selectedModels, responses, tokens_used) {
    console.log(`Storing responses for chat ${chat_id}, prompt ${prompt_id}...`);

    if (!chat_id) {
        console.error('No chat ID provided for storing responses');
        return;
    }

    try {
        for (let i = 0; i < selectedModels.length; i++) {
            // Calculate the total tokens used for prompt+response for each of the selected chatbots
            calculateTotalTokens(prompt_id, responses[i], selectedModels[i]); 

            // Store the response in the database
            const { data, error } = await supabase
                .from('responses')
                .insert([{
                    chat_id: chat_id,
                    prompt_id: prompt_id,
                    content: responses[i],
                    model_used: selectedModels[i],
                    tokens_used: tokens_used[i],
                }]);

            if (error) {
                console.error(`Error storing ${selectedModels[i]}'s response:`, error);
            } else {
                console.log(`${selectedModels[i]}'s response stored successfully`);
            }
        }
    } catch (error) {
        console.error('Error in storeResponses:', error);
        throw error;
    }
}

export async function storeTokensUsedPerResponse(chat_id, prompt_id, selectedModels, tokensUsed) {
    console.log(`Storing tokens used for chat ${chat_id}, prompt ${prompt_id}...`);

    for (let i = 0; i < selectedModels.length; i++) {
        const {data, error} = await supabase
        .from('responses')
        .update({tokens_used: tokensUsed[i]})
        .eq('chat_id', chat_id)
        .eq('prompt_id', prompt_id)
        .eq('model_used', selectedModels[i])

        if (error) {
            console.log('Unable to store tokens used per response', error.message)
        } else {
            console.log('Tokens used per response stored successfully')
        }
    }

}


export async function getPrompt(prompt_id, chat_id) {
    console.log('Fetching conversation...')

    const {data, error} = await supabase
    .from('prompts')
    .select('content')
    .eq('chat_id', chat_id)
    .order('created_at', { ascending: false })
    .limit(1)

    if (error) {
        console.log('Unable to fetch the most recent prompt')
    } else {
        console.log('Most recent prompt has been fetched successfully')
        return data[0].content
    }
}

export async function getChatMessages(chat_id) {
    console.log('Fetching all the chat messages...')
    
    // Fetch prompts + responses in parallel
    const {data: prompts, error: promptsError} = await supabase
      .from('prompts')
      .select('*')
      .eq('chat_id', chat_id)
      
    const {data: responses, error: responsesError} = await supabase
      .from('responses')
      .select('id, prompt_id, content, model_used, tokens_used, created_at') // Added 'id'
      .eq('chat_id', chat_id)
    
    // Check for errors
    if (promptsError) {
      console.error("Error fetching prompts:", promptsError.message);
      return null;
    }
    if (responsesError) {
      console.error("Error fetching responses:", responsesError.message);
      return null;
    }
    
    // Debug the data before merging
    console.log("Prompts:", prompts);
    console.log("Responses:", responses);
    
    // Merge
    const messages = [...prompts, ...responses];
    
    // Sort by created_at ascending
    messages.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      
      // Debug invalid dates
      if (isNaN(dateA.getTime())) {
        console.log("Invalid date A:", a.created_at, "Object:", a);
      }
      if (isNaN(dateB.getTime())) {
        console.log("Invalid date B:", b.created_at, "Object:", b);
      }
      
      return dateA - dateB;
    });
    
    console.log("All messages have been fetched successfully:", messages);
    return messages;
  }


export async function calculateTotalTokens(prompt_id, response, selectedModel) {
    
    // Get prompt
    const prompt = await getPrompt(prompt_id)
    console.log("PROMPT:", prompt)

    // CONTINUE

    
}

// TODO: Add error handling to all the above functions