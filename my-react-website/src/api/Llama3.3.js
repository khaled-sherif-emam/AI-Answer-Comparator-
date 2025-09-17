import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// Note: In a production environment, you should store this in an environment variable
const token = process.env.REACT_APP_GITHUB_TOKEN || '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';

const client = ModelClient(
    "https://models.github.ai/inference",
    new AzureKeyCredential(token)
);

export default async function askLlama3(prompt) {
    try {
        const response = await client.path("/chat/completions").post({
            body: {
                messages: [
                    { role: "system", content: "You are Llama 3.3, an AI assistant that provides clear, user-friendly answers.- Always explain things in a conversational, helpful style.- Format your answers for easy reading (use bullet points, steps, or short paragraphs).- Be concise but not robotic- For calculations, give the final result first, then optionally a short explanation.- Avoid overly technical breakdowns unless the user explicitly asks for step-by-step reasoning.- When listing or explaining, use clean formatting (markdown lists, bolding, etc. Don't add #'s for headers please just make them **bold**" },
                    { role: "user", content: prompt }
                ],
                model: "meta/Llama-3.3-70B-Instruct",
                temperature: 0.8,
                max_tokens: 4096,
                top_p: 0.1
            }
        });

        // Calaculate the total tokens used to generate a response
        const usage = response.body.usage;
        let totalTokensUsed;
        if (usage) {
            console.log("Prompt tokens:", usage.prompt_tokens);
            console.log("Completion tokens:", usage.completion_tokens);
            console.log("Total tokens:", usage.total_tokens);
            totalTokensUsed = usage.total_tokens;
        }

        if (isUnexpected(response)) {
            throw response.body.error || new Error('Unexpected response from Llama 3.3 API');
        }

        const responseContent = response.body.choices[0]?.message?.content;
        return [responseContent, totalTokensUsed];
    } catch (error) {
        console.error('Error in askLlama3:', error);
        throw error;
    }
}
