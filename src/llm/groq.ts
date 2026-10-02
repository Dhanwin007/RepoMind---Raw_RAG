import Groq from "groq-sdk";
import "dotenv/config";


const groq =
    new Groq({
        apiKey: process.env.GROQ_API_KEY
    });


const MODEL_NAME =
   "openai/gpt-oss-120b";


export async function generateAnswer(
    query: string,
    context: string
): Promise<string> {

    const response =
        await groq.chat.completions.create({

            model: MODEL_NAME,

            messages: [

                {
                    role: "system",

                    content: `
You are RepoMind, an AI assistant that answers questions about software repositories.

Use only the provided repository context to answer the user's question.

Rules:
- Do not invent files, functions, or code.
- Answer only from the provided context.
- Mention relevant file paths.
- Include line ranges when available.
- Cite sources using this format: [src/server.ts:1-40]
- Use clean Markdown.
- Use bullet points for multiple items.
- Do not use HTML tags such as <br>.
- Do not create unnecessary tables.
- Put code identifiers such as app.use() inside backticks.
- If the provided context is insufficient, say so clearly.
- Keep the answer concise and technically accurate.
                    `.trim()
                },

                {
                    role: "user",

                    content: `
Question:
${query}

Repository Context:
${context}
                    `.trim()
                }

            ]
        });


    return (
        response.choices[0]?.message?.content
        ?? ""
    );
}