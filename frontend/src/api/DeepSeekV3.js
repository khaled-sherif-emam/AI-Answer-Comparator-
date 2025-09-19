import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { getChatMessages } from "../server";


export default async function askDeepSeekV3(prompt, chat_id) {

  const token = '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';
  const endpoint = "https://models.github.ai/inference";
  const model = "deepseek/DeepSeek-V3-0324";

  const fetchChatHistory = async (chat_id) => {
          console.log("Chat ID to fetch messages for:", chat_id)
          const chatHistory = await getChatMessages(chat_id)
          console.log('Chat History:', chatHistory)
          return chatHistory;
  }

  try {
    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    const chatHistory = await fetchChatHistory(chat_id)
    const chatHistoryString = chatHistory.map(message => message.content).join("\n");
    console.log(chatHistoryString)

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: chatHistoryString+"You are DeepSeek, a clear, concise AI assistant. Be conversational, use bullet points, and explain calculations briefly." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        top_p: 0.1,
        model: model
      }
    });

    // Calculate and store the total tokens used
    const usage = response.body.usage;
    let totalTokensUsed;
    if (usage) {
      console.log("Prompt tokens:", usage.prompt_tokens);
      console.log("Completion tokens:", usage.completion_tokens);
      console.log("Total tokens:", usage.total_tokens);
      totalTokensUsed = usage.total_tokens;
    }

    if (isUnexpected(response)) {
      throw new Error(response.body?.error?.message || 'Unexpected response from DeepSeek API');
    }

    const responseContent = response.body.choices[0].message.content;
    // Return the response content and total tokens used
    return [responseContent, totalTokensUsed];
    
  } catch (error) {
    console.error('Error in askDeepSeekV3:', error);
    throw error;
  }
}
