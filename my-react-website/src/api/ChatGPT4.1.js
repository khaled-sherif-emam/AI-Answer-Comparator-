import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { getChatMessages } from "../server";
import { useState } from "react";




export default async function askChatGPT4(prompt, chat_id) {
    const token = "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";
    const endpoint = "https://models.github.ai/inference";
    const model = "openai/gpt-4.1";



    const fetchChatHistory = async (chat_id) => {
        console.log("Chat ID to fetch messages for:", chat_id)
        const chatHistory = await getChatMessages(chat_id)
        console.log('Chat History:', chatHistory)
        return chatHistory;
    }

    try {
        const client = ModelClient(endpoint, new AzureKeyCredential(token));
        
        // Get the history of the chat so that the model can understand the context
        let chatHistory;
        let chatHistoryString = "";
        if (chat_id) {
            chatHistory = await fetchChatHistory(chat_id)
            chatHistoryString = chatHistory.map(message => message.content).join("\n");
            console.log(chatHistoryString)
        }
        
        
        const response = await client.path("/chat/completions").post({
            body: {
                messages: [
                    { role: "system", content: chatHistoryString+"You are ChatGPT, a clear, concise AI assistant. Be conversational, use bullet points, and explain calculations briefly." },
                    { role: "user", content: prompt }
                ],
                model: model,
            }
        });

        const usage = response.body.usage;
        let totalTokensUsed;
        if (usage) {
            console.log("Prompt tokens:", usage.prompt_tokens);
            console.log("Completion tokens:", usage.completion_tokens);
            console.log("Total tokens:", usage.total_tokens);
            totalTokensUsed = usage.total_tokens;
        }

        if (isUnexpected(response)) {
            throw response.body.error;
        }

        const responseContent = response.body.choices[0].message.content;

        return [responseContent, totalTokensUsed]; // properly return
    } catch (err) {
        console.error("The sample encountered an error:", err);
        throw err; // re-throw so the caller can handle it
    }
}